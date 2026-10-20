import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import {
  ComplianceReviewError, DEFAULT_MODEL, MAX_COMPLIANCE_CHARS, buildMessages, buildRules, checkFileName, extractJson,
  handleComplianceReviewRequest, normalizeComplianceReview, normalizeStatus, parseComplianceRequest, reviewCompliance,
} from '../server/compliance-review.ts'
import { buildSampleComplianceText } from '../src/domain/compliance-sample.ts'
import { ricFileName } from '../src/domain/rules.ts'

// Nenhum teste chama a rede: a chamada à OpenRouter é substituída por `fetchImpl`.
const FAKE_KEY = 'chave-falsa-somente-para-teste'
const title = 'Painel de indicadores para cooperativas locais'
const expectedFileName = ricFileName({ courseCode: 'DSM', year: 2026, semester: 2, firstAuthor: 'Davi Rocha', title })
const context = {
  title, authors: ['Davi Rocha'], courseCode: 'DSM', year: 2026, semester: 2, expectedFileName, fileName: 'painel-cooperativas-v2.pdf',
  corrections: [
    { title: 'Padronizar as referências', detail: 'Conferir ordem, ano e formato.', status: 'concluida' },
    { title: 'Explicar o método de coleta', detail: 'Descrever os critérios de seleção dos dados.', status: 'concluida' },
  ],
  grade: 8.5, nominated: true, accessLevel: 'restrito',
}
const versaoText = buildSampleComplianceText('versao-final', context)
const termoText = buildSampleComplianceText('termo', context, { courseName: 'Desenvolvimento de Software Multiplataforma', advisor: 'Profa. Camila', defenseDate: '2026-10-07', workType: 'Protótipo', hasProduct: true })
const versaoRequest = parseComplianceRequest({ kind: 'versao-final', text: versaoText, context })
const termoRequest = parseComplianceRequest({ kind: 'termo', text: termoText, context })

function fakeFetch(handler) {
  const calls = []
  const impl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) })
    return handler(calls.length)
  }
  return { impl, calls }
}
const okResponse = (content) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { role: 'assistant', content } }] }) })
const failResponse = (status) => ({ ok: false, status, json: async () => ({ error: { message: `detalhe interno ${FAKE_KEY}` } }) })

/** Resposta de modelo bem formada para todos os itens avaliados pela IA. */
function modelAnswer(request, overrides = {}) {
  const items = buildRules(request.kind, request.context).filter((rule) => !rule.deterministic)
    .map((rule) => ({ id: rule.id, status: 'ok', evidence: `"trecho de ${rule.id}"`, ...overrides[rule.id] }))
  return { items, summary: 'Revisão concluída.', confidence: 'alta', ...overrides.root }
}

async function expectError(promise, status, pattern) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof ComplianceReviewError, `esperava ComplianceReviewError, veio ${error}`)
    assert.equal(error.status, status)
    if (pattern) assert.match(error.message, pattern)
    assert.ok(!error.message.includes(FAKE_KEY))
    return true
  })
}

/* ------------------------------- Entrada ------------------------------- */

test('aceita tipo, texto e contexto válidos e normaliza o contexto', () => {
  const request = parseComplianceRequest({
    kind: 'termo', text: `  ${termoText}  `,
    context: {
      title: '  Meu   TCC ', authors: ['  Ana  ', '', 42, 'Bia'], courseCode: ' DSM ', year: 2026, semester: 2, expectedFileName: ' a.pdf ', fileName: '',
      corrections: [{ title: ' Ajustar ', detail: ' Detalhe ', status: 'aberta' }, { title: '', detail: '' }, 'solto', null, { detail: 'Só detalhe' }],
      grade: '8,5', nominated: true, accessLevel: 'integral',
    },
  })
  assert.equal(request.kind, 'termo')
  assert.equal(request.text, termoText.trim())
  assert.deepEqual(request.context, {
    title: 'Meu TCC', authors: ['Ana', 'Bia'], courseCode: 'DSM', year: 2026, semester: 2, expectedFileName: 'a.pdf',
    corrections: [{ title: 'Ajustar', detail: 'Detalhe', status: 'aberta' }, { title: 'Só detalhe', detail: 'Só detalhe', status: '' }],
    grade: 8.5, nominated: true, accessLevel: 'integral',
  })
})

test('rejeita corpo inválido, tipo desconhecido, texto vazio e texto acima de 15.000 caracteres', () => {
  for (const body of [null, 'texto', [], {}, { kind: 'ata', text: versaoText }, { kind: 'termo' }, { kind: 'termo', text: 123 }, { kind: 'termo', text: '   ' }, { kind: 'termo', text: 'curto' }]) {
    assert.throws(() => parseComplianceRequest(body), (error) => error instanceof ComplianceReviewError && error.status === 400, JSON.stringify(body))
  }
  assert.doesNotThrow(() => parseComplianceRequest({ kind: 'termo', text: 'a'.repeat(MAX_COMPLIANCE_CHARS), context }))
  assert.throws(() => parseComplianceRequest({ kind: 'termo', text: 'a'.repeat(MAX_COMPLIANCE_CHARS + 1), context }), (error) => error instanceof ComplianceReviewError && error.status === 413)
})

test('tolera contexto ausente ou malformado e descarta valores inválidos', () => {
  const empty = { title: '', authors: [], courseCode: '', expectedFileName: '', corrections: [] }
  assert.deepEqual(parseComplianceRequest({ kind: 'termo', text: termoText, context: 'x' }).context, empty)
  assert.deepEqual(parseComplianceRequest({ kind: 'termo', text: termoText, context: { authors: 'Ana', year: 'abc', semester: 3, grade: 11, nominated: 'sim', accessLevel: 'publico', corrections: 'x' } }).context, empty)
  const many = Array.from({ length: 30 }, (_, index) => ({ title: `Correção ${index}`, detail: 'x', status: 'aberta' }))
  assert.equal(parseComplianceRequest({ kind: 'versao-final', text: versaoText, context: { corrections: many } }).context.corrections.length, 10)
})

/* ------------------------------- Regras e prompt ------------------------------- */

test('versão final avalia cada correção da banca, a estrutura, título, autores e o nome do arquivo', () => {
  const rules = buildRules('versao-final', context)
  assert.deepEqual(rules.map((rule) => rule.id), ['correcao-1', 'correcao-2', 'estrutura', 'titulo', 'autores', 'nome-arquivo'])
  assert.match(rules.find((rule) => rule.id === 'estrutura').source, /ABNT NBR 14724.*regulamento do curso/)
  assert.match(rules.find((rule) => rule.id === 'nome-arquivo').source, /4069\/2024, Art\. 6/)
  assert.deepEqual(rules.filter((rule) => rule.deterministic).map((rule) => rule.id), ['nome-arquivo'])
  assert.ok(rules.every((rule) => rule.source && rule.rule))
})

test('termo avalia os campos do Anexo C, a coerência com o cadastro e o Art. 14', () => {
  const rules = buildRules('termo', context)
  assert.ok(rules.some((rule) => rule.id === 'texto-integral' && /Art\. 14/.test(rule.source)))
  assert.ok(rules.some((rule) => rule.id === 'coerencia-nota-indicacao') && rules.some((rule) => rule.id === 'coerencia-titulo'))
  assert.ok(rules.filter((rule) => rule.id !== 'nome-arquivo' && rule.id !== 'coerencia-titulo' && rule.id !== 'texto-integral').every((rule) => /Anexo C/.test(rule.source)))
  assert.equal(new Set(rules.map((rule) => rule.id)).size, rules.length)
})

test('o prompt manda avaliar só o texto, marcar nao-verificavel e nunca aprovar; leva cadastro e itens', () => {
  const [system, user] = buildMessages(versaoRequest)
  assert.equal(system.role, 'system')
  assert.match(system.content, /SOMENTE o que está escrito/)
  assert.match(system.content, /nao-verificavel/)
  assert.match(system.content, /nunca aprova/)
  assert.equal(user.role, 'user')
  assert.ok(user.content.includes(title) && user.content.includes('Davi Rocha'))
  assert.ok(user.content.includes('Explicar o método de coleta'))
  assert.ok(user.content.includes('id: correcao-2') && user.content.includes('id: estrutura'))
  assert.ok(!user.content.includes('id: nome-arquivo'), 'o nome do arquivo não vai para a IA')
  assert.ok(user.content.includes(versaoText.trim().slice(0, 40)))
  const termo = buildMessages(termoRequest)[1].content
  assert.ok(termo.includes('Nota da banca: 8,5') && termo.includes('id: texto-integral'))
})

/* --------------------------- Checagem do nome do arquivo --------------------------- */

test('o nome do arquivo esperado segue a Portaria (curso_ano_semestre_autor_5palavras.pdf)', () => {
  assert.equal(expectedFileName, 'dsm_2026_2_davirocha_paineldeindicadoresparacooperativas.pdf')
})

test('checagem determinística do nome do arquivo: ok, falha e não verificável', () => {
  const ok = checkFileName({ ...context, fileName: expectedFileName })
  assert.equal(ok.status, 'ok')
  assert.equal(ok.id, 'nome-arquivo')
  assert.match(ok.source, /Art\. 6/)
  assert.equal(ok.suggestion, undefined)
  const wrong = checkFileName(context)
  assert.equal(wrong.status, 'falha')
  assert.ok(wrong.evidence.includes('painel-cooperativas-v2.pdf') && wrong.evidence.includes(expectedFileName))
  assert.ok(wrong.suggestion.includes(expectedFileName))
  // maiúsculas e espaços contam como divergência: a Portaria pede minúsculas e sem espaços
  assert.equal(checkFileName({ ...context, fileName: expectedFileName.toUpperCase() }).status, 'falha')
  assert.equal(checkFileName({ ...context, fileName: undefined }).status, 'nao-verificavel')
  assert.equal(checkFileName({ ...context, expectedFileName: '' }).status, 'nao-verificavel')
})

test('o item do nome do arquivo é mesclado no resultado sem depender da IA', () => {
  // mesmo que o modelo tente avaliar nome-arquivo (aprovando), vale a checagem do servidor
  const answer = modelAnswer(versaoRequest)
  answer.items.push({ id: 'nome-arquivo', status: 'ok', evidence: 'parece certo' })
  const review = normalizeComplianceReview(answer, versaoRequest)
  const item = review.items.find((entry) => entry.id === 'nome-arquivo')
  assert.equal(item.status, 'falha')
  assert.deepEqual(review.items.map((entry) => entry.id), ['correcao-1', 'correcao-2', 'estrutura', 'titulo', 'autores', 'nome-arquivo'])
})

/* ------------------------------- Normalização ------------------------------- */

test('normaliza uma resposta correta: rule e source vêm do servidor', () => {
  const review = normalizeComplianceReview(modelAnswer(versaoRequest, { estrutura: { status: 'falha', evidence: 'Não há "Palavras-chave".', suggestion: 'Incluir palavras-chave.' } }), versaoRequest)
  assert.equal(review.items.length, 6)
  assert.equal(review.summary, 'Revisão concluída.')
  assert.equal(review.confidence, 'alta')
  const estrutura = review.items.find((item) => item.id === 'estrutura')
  assert.deepEqual(estrutura, {
    id: 'estrutura', rule: buildRules('versao-final', context).find((rule) => rule.id === 'estrutura').rule, source: estrutura.source,
    status: 'falha', evidence: 'Não há "Palavras-chave".', suggestion: 'Incluir palavras-chave.',
  })
  assert.match(estrutura.source, /ABNT NBR 14724/)
  const ok = review.items.find((item) => item.id === 'titulo')
  assert.equal(ok.status, 'ok')
  assert.ok(!('suggestion' in ok))
})

test('normaliza o status: variações com acento viram o valor canônico e o resto vira nao-verificavel', () => {
  assert.equal(normalizeStatus('ok'), 'ok')
  assert.equal(normalizeStatus(' OK '), 'ok')
  assert.equal(normalizeStatus('Atenção'), 'atencao')
  assert.equal(normalizeStatus('FALHA'), 'falha')
  assert.equal(normalizeStatus('não verificável'), 'nao-verificavel')
  assert.equal(normalizeStatus('nao_verificavel'), 'nao-verificavel')
  for (const invalid of ['aprovado', 'pass', '', null, undefined, 1, true, [], {}]) assert.equal(normalizeStatus(invalid), 'nao-verificavel', String(invalid))
})

test('ok sem evidência não é aceito; evidência e sugestão são limpas e limitadas', () => {
  const review = normalizeComplianceReview(modelAnswer(versaoRequest, {
    titulo: { status: 'ok', evidence: '   ' },
    autores: { status: 'atencao', evidence: `  vários   espaços ${'x'.repeat(900)}`, suggestion: 'y'.repeat(900) },
    estrutura: { status: 'ok', evidence: '"Resumo"', suggestion: 'não deveria aparecer' },
  }), versaoRequest)
  const byId = Object.fromEntries(review.items.map((item) => [item.id, item]))
  assert.equal(byId.titulo.status, 'nao-verificavel')
  assert.equal(byId.autores.evidence.length, 500)
  assert.ok(byId.autores.evidence.startsWith('vários espaços'))
  assert.equal(byId.autores.suggestion.length, 400)
  assert.equal(byId.estrutura.suggestion, undefined)
})

test('itens ausentes viram nao-verificavel; ids desconhecidos e repetidos são descartados', () => {
  const answer = modelAnswer(versaoRequest)
  answer.items = answer.items.filter((item) => item.id !== 'autores')
  answer.items.push({ id: 'invento', status: 'falha', evidence: 'x' }, { id: 'titulo', status: 'falha', evidence: 'duplicado' }, 'texto', null, 7, {})
  const review = normalizeComplianceReview(answer, versaoRequest)
  assert.equal(review.items.length, 6)
  assert.equal(review.items.find((item) => item.id === 'autores').status, 'nao-verificavel')
  assert.equal(review.items.find((item) => item.id === 'titulo').status, 'ok')
  assert.ok(!review.items.some((item) => item.id === 'invento'))
})

test('resumo e confiança: preenche o resumo ausente e assume baixa quando falta ou há muita incerteza', () => {
  const noSummary = normalizeComplianceReview({ ...modelAnswer(versaoRequest), summary: '' }, versaoRequest)
  assert.match(noSummary.summary, /6 itens revisados.*não substitui o aval do orientador/)
  for (const invalid of ['muito alta', '', null, undefined, 3]) {
    assert.equal(normalizeComplianceReview({ ...modelAnswer(versaoRequest), confidence: invalid }, versaoRequest).confidence, 'baixa', String(invalid))
  }
  assert.equal(normalizeComplianceReview({ ...modelAnswer(versaoRequest), confidence: 'Média' }, versaoRequest).confidence, 'media')
  const unsure = modelAnswer(versaoRequest)
  for (const item of unsure.items) item.status = 'nao-verificavel'
  assert.equal(normalizeComplianceReview(unsure, versaoRequest).confidence, 'baixa')
})

test('rejeita respostas que não são um objeto reconhecível (502)', () => {
  for (const raw of [null, undefined, 'texto', 42, [], [{ items: [] }], {}, { foo: 'bar' }, { items: [] }, { items: 'x', summary: 'ok' }, { items: [{ id: 'invento', status: 'ok', evidence: 'x' }] }]) {
    assert.throws(() => normalizeComplianceReview(raw, versaoRequest), (error) => error instanceof ComplianceReviewError && error.status === 502, JSON.stringify(raw))
  }
})

test('extrai JSON puro, com cerca de código e com texto ao redor', () => {
  assert.deepEqual(extractJson('{"summary": "a"}'), { summary: 'a' })
  assert.deepEqual(extractJson('```json\n{"summary": "a"}\n```'), { summary: 'a' })
  assert.deepEqual(extractJson('Segue:\n{"summary": "a"}\nBom trabalho!'), { summary: 'a' })
  assert.throws(() => extractJson('sem json aqui'), (error) => error instanceof ComplianceReviewError && error.status === 502)
  assert.throws(() => extractJson('{"summary": '), (error) => error instanceof ComplianceReviewError && error.status === 502)
})

/* ---------------------------- Chamada ao modelo ---------------------------- */

test('chama a OpenRouter com chave, cabeçalhos e parâmetros esperados e mescla o nome do arquivo', async () => {
  const { impl, calls } = fakeFetch(() => okResponse(JSON.stringify(modelAnswer(versaoRequest))))
  const review = await reviewCompliance(versaoRequest, { apiKey: FAKE_KEY, referer: 'https://integrae.example', fetchImpl: impl })
  assert.equal(review.items.length, 6)
  assert.equal(review.items.at(-1).status, 'falha')
  assert.equal(calls.length, 1)
  const [{ url, init, body }] = calls
  assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions')
  assert.equal(init.method, 'POST')
  assert.equal(init.headers.Authorization, `Bearer ${FAKE_KEY}`)
  assert.equal(init.headers['HTTP-Referer'], 'https://integrae.example')
  assert.equal(init.headers['X-Title'], 'Integrae')
  assert.ok(init.signal instanceof AbortSignal)
  assert.equal(body.model, DEFAULT_MODEL)
  assert.ok(body.temperature <= 0.3)
  assert.ok(body.max_tokens >= 1500)
  assert.deepEqual(body.response_format, { type: 'json_object' })
  assert.ok(!JSON.stringify(body).includes(FAKE_KEY))
})

test('usa o modelo configurado e entende a resposta suja do modelo', async () => {
  const dirty = '```json\n' + JSON.stringify({ ...modelAnswer(termoRequest, { 'texto-integral': { status: 'Atenção', evidence: '"restrito"' } }), confidence: 'Média' }) + '\n```'
  const { impl, calls } = fakeFetch(() => okResponse(dirty))
  const review = await reviewCompliance(termoRequest, { apiKey: FAKE_KEY, model: 'provedor/outro-modelo', fetchImpl: impl })
  assert.equal(calls[0].body.model, 'provedor/outro-modelo')
  assert.equal(review.confidence, 'media')
  assert.equal(review.items.find((item) => item.id === 'texto-integral').status, 'atencao')
})

test('sem chave configurada responde 503 e não chama a rede', async () => {
  const { impl, calls } = fakeFetch(() => okResponse('{}'))
  for (const apiKey of [undefined, '', '   ']) {
    await expectError(reviewCompliance(versaoRequest, { apiKey, fetchImpl: impl }), 503, /OPENROUTER_API_KEY/)
  }
  assert.equal(calls.length, 0)
})

test('erros do provedor viram mensagens seguras, sem detalhes internos', async () => {
  const run = (handler) => reviewCompliance(versaoRequest, { apiKey: FAKE_KEY, fetchImpl: fakeFetch(handler).impl })
  await expectError(run(() => failResponse(401)), 502, /indisponível/)
  await expectError(run(() => failResponse(500)), 502, /indisponível/)
  await expectError(run(() => failResponse(429)), 429, /Muitas solicitações/)
  await expectError(run(() => failResponse(408)), 504, /demorou/)
  await expectError(run(() => { throw new TypeError(`fetch failed ${FAKE_KEY}`) }), 502, /indisponível/)
  await expectError(run(() => { throw Object.assign(new Error('timeout'), { name: 'TimeoutError' }) }), 504, /demorou/)
  await expectError(run(() => okResponse('')), 502, /não devolveu/)
  await expectError(run(() => okResponse('Desculpe, não consegui.')), 502, /não pôde ser lida/)
  await expectError(run(() => okResponse('{"foo": 1}')), 502, /fora do formato/)
})

test('o log do servidor redige a chave e não inclui o texto do documento', async () => {
  const log = mock.method(console, 'error', () => {})
  try {
    await assert.rejects(reviewCompliance(versaoRequest, { apiKey: FAKE_KEY, fetchImpl: fakeFetch(() => failResponse(401)).impl }))
    const lines = log.mock.calls.map((call) => call.arguments.join(' '))
    assert.equal(lines.length, 1)
    assert.ok(lines[0].startsWith('[compliance-review]') && lines[0].endsWith('HTTP 401: detalhe interno [chave]'), lines[0])
    assert.ok(!lines[0].includes(FAKE_KEY) && !lines[0].includes(title))
  } finally { log.mock.restore() }
})

/* --------------------------------- HTTP --------------------------------- */

function fakeRequest({ method = 'POST', body, raw } = {}) {
  const chunks = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw]
  const request = { method, async *[Symbol.asyncIterator]() { for (const chunk of chunks) yield chunk } }
  if (body !== undefined) request.body = body
  return request
}
function fakeResponse() {
  return { statusCode: 200, headers: {}, payload: '', setHeader(name, value) { this.headers[name] = value }, end(text) { this.payload = text ?? '' } }
}
const jsonBody = (response) => JSON.parse(response.payload)
const goodBody = { kind: 'versao-final', text: versaoText, context }
const goodModel = () => fakeFetch(() => okResponse(JSON.stringify(modelAnswer(versaoRequest)))).impl

test('POST válido devolve 200 com a revisão em JSON', async () => {
  const response = fakeResponse()
  const bytes = new TextEncoder().encode(JSON.stringify(goodBody))
  await handleComplianceReviewRequest(fakeRequest({ raw: [bytes.slice(0, 50), bytes.slice(50)] }), response, { apiKey: FAKE_KEY, fetchImpl: goodModel() })
  assert.equal(response.statusCode, 200)
  assert.match(response.headers['Content-Type'], /application\/json/)
  assert.deepEqual(Object.keys(jsonBody(response)), ['items', 'summary', 'confidence'])
  assert.equal(jsonBody(response).items.length, 6)
  assert.ok(!response.payload.includes(FAKE_KEY))
})

test('aceita o corpo já interpretado pela Vercel (objeto ou texto)', async () => {
  for (const body of [goodBody, JSON.stringify(goodBody)]) {
    const response = fakeResponse()
    await handleComplianceReviewRequest(fakeRequest({ body }), response, { apiKey: FAKE_KEY, fetchImpl: goodModel() })
    assert.equal(response.statusCode, 200)
  }
})

test('só aceita POST', async () => {
  const response = fakeResponse()
  await handleComplianceReviewRequest(fakeRequest({ method: 'GET' }), response, { apiKey: FAKE_KEY, fetchImpl: goodModel() })
  assert.equal(response.statusCode, 405)
  assert.equal(response.headers.Allow, 'POST')
  assert.equal(typeof jsonBody(response).error, 'string')
})

test('sem chave devolve 503 com a mensagem de configuração', async () => {
  const response = fakeResponse()
  await handleComplianceReviewRequest(fakeRequest({ raw: JSON.stringify(goodBody) }), response, { apiKey: undefined })
  assert.equal(response.statusCode, 503)
  assert.deepEqual(jsonBody(response), { error: 'IA indisponível: configure OPENROUTER_API_KEY no servidor' })
})

test('texto grande demais devolve 413, antes de chamar a IA', async () => {
  const { impl, calls } = fakeFetch(() => okResponse('{}'))
  let response = fakeResponse()
  await handleComplianceReviewRequest(fakeRequest({ raw: JSON.stringify({ ...goodBody, text: 'a'.repeat(MAX_COMPLIANCE_CHARS + 1) }) }), response, { apiKey: FAKE_KEY, fetchImpl: impl })
  assert.equal(response.statusCode, 413)
  assert.match(jsonBody(response).error, /15\.000/)
  response = fakeResponse()
  await handleComplianceReviewRequest(fakeRequest({ raw: JSON.stringify({ ...goodBody, text: 'a'.repeat(500_000) }) }), response, { apiKey: FAKE_KEY, fetchImpl: impl })
  assert.equal(response.statusCode, 413)
  assert.equal(calls.length, 0)
})

test('JSON inválido, tipo inválido e texto vazio devolvem 400 em português', async () => {
  for (const [raw, pattern] of [['{nao é json', /Requisição inválida/], [JSON.stringify({ ...goodBody, kind: 'ata' }), /Tipo de documento inválido/], [JSON.stringify({ ...goodBody, text: '' }), /Cole o texto/]]) {
    const response = fakeResponse()
    await handleComplianceReviewRequest(fakeRequest({ raw }), response, { apiKey: FAKE_KEY })
    assert.equal(response.statusCode, 400)
    assert.match(jsonBody(response).error, pattern)
  }
})

test('falha do provedor vira { error } sem expor a chave nem o detalhe', async () => {
  const response = fakeResponse()
  await handleComplianceReviewRequest(fakeRequest({ raw: JSON.stringify(goodBody) }), response, { apiKey: FAKE_KEY, fetchImpl: fakeFetch(() => failResponse(401)).impl })
  assert.equal(response.statusCode, 502)
  assert.deepEqual(Object.keys(jsonBody(response)), ['error'])
  assert.ok(!response.payload.includes(FAKE_KEY) && !response.payload.includes('detalhe interno'))
})

/* ------------------------------ Texto de exemplo ------------------------------ */

test('o texto de exemplo da versão final usa o cadastro, trata 1 correção, deixa as outras e omite as palavras-chave', () => {
  assert.ok(versaoText.includes(title.toUpperCase()) && versaoText.includes('Davi Rocha'))
  assert.ok(versaoText.includes('Padronizar as referências'))
  assert.ok(!versaoText.includes('Explicar o método de coleta'))
  for (const section of ['RESUMO', 'INTRODUÇÃO', 'METODOLOGIA', 'CONCLUSÃO', 'REFERÊNCIAS']) assert.ok(versaoText.includes(section), section)
  assert.ok(!/palavras-chave/i.test(versaoText))
  assert.ok(versaoText.length < MAX_COMPLIANCE_CHARS)
})

test('o texto de exemplo do termo traz os campos do Anexo C, sem agência de fomento nem assinatura do coordenador', () => {
  for (const field of ['Curso:', 'Título do trabalho:', 'Tipo do trabalho: Protótipo', 'Produto complementar: Sim', 'Orientador(a): Profa. Camila', 'Data da defesa: 07/10/2026', 'Nota: 8,5', 'Indicação da banca', 'Opção de acesso: restrito']) {
    assert.ok(termoText.includes(field), field)
  }
  assert.ok(!/fomento/i.test(termoText))
  assert.ok(termoText.includes('Coordenador(a) do curso ______________________\n'))
  assert.doesNotThrow(() => parseComplianceRequest({ kind: 'termo', text: termoText, context }))
})
