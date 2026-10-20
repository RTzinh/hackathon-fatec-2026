import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import {
  AtaAssistantError, DEFAULT_MODEL, MAX_ATA_CHARS, analyzeAta, buildMessages, extractJson, handleAtaAssistantRequest,
  normalizeAtaAnalysis, normalizeDate, parseAtaRequest, withDateDivergence,
} from '../server/ata-assistant.ts'
import { buildSampleAta } from '../src/domain/ata-sample.ts'

// Nenhum teste chama a rede: a chamada à OpenRouter é substituída por `fetchImpl`.
const FAKE_KEY = 'chave-falsa-somente-para-teste'
const context = { title: 'Painel de indicadores para cooperativas locais', authors: ['Davi Rocha'], defenseDate: '2026-10-07' }
const ataText = buildSampleAta(context)

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
const goodJson = JSON.stringify({
  grade: 8.5, nominated: true, defenseDate: '2026-10-07', evaluators: ['Prof. Dr. Henrique Moura'],
  corrections: [{ title: 'Padronizar as referências', detail: 'Conferir ordem, ano e formato.' }], divergences: [], confidence: 'alta',
})

async function expectError(promise, status, pattern) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof AtaAssistantError, `esperava AtaAssistantError, veio ${error}`)
    assert.equal(error.status, status)
    if (pattern) assert.match(error.message, pattern)
    assert.ok(!error.message.includes(FAKE_KEY))
    return true
  })
}

/* ------------------------------- Entrada ------------------------------- */

test('aceita ata e contexto válidos e normaliza o contexto', () => {
  const request = parseAtaRequest({ ataText: `  ${ataText}  `, context: { title: '  Meu   TCC ', authors: ['  Ana  ', '', 42, 'Bia'], defenseDate: '07/10/2026' } })
  assert.equal(request.ataText, ataText.trim())
  assert.deepEqual(request.context, { title: 'Meu TCC', authors: ['Ana', 'Bia'], defenseDate: '2026-10-07' })
})

test('rejeita corpo inválido, ata vazia e ata acima de 15.000 caracteres', () => {
  for (const body of [null, 'texto', [], {}, { ataText: 123 }, { ataText: '   ' }, { ataText: 'curto' }]) {
    assert.throws(() => parseAtaRequest(body), (error) => error instanceof AtaAssistantError && error.status === 400)
  }
  assert.doesNotThrow(() => parseAtaRequest({ ataText: 'a'.repeat(MAX_ATA_CHARS), context }))
  assert.throws(() => parseAtaRequest({ ataText: 'a'.repeat(MAX_ATA_CHARS + 1), context }), (error) => error instanceof AtaAssistantError && error.status === 413)
})

test('tolera contexto ausente ou malformado', () => {
  assert.deepEqual(parseAtaRequest({ ataText, context: 'x' }).context, { title: '', authors: [], defenseDate: '' })
  assert.deepEqual(parseAtaRequest({ ataText, context: { authors: 'Ana', defenseDate: '2026-02-31' } }).context, { title: '', authors: [], defenseDate: '' })
})

test('o prompt leva cadastro e ata, e instrui a não inventar', () => {
  const [system, user] = buildMessages(parseAtaRequest({ ataText, context }))
  assert.equal(system.role, 'system')
  assert.match(system.content, /SOMENTE o que está escrito/)
  assert.match(system.content, /null/)
  assert.equal(user.role, 'user')
  assert.ok(user.content.includes(context.title))
  assert.ok(user.content.includes('Davi Rocha'))
  assert.ok(user.content.includes('07/10/2026'))
  assert.ok(user.content.includes(ataText.trim().slice(0, 40)))
})

/* ------------------------------- Resposta ------------------------------- */

test('extrai JSON puro, com cerca de código e com texto ao redor', () => {
  const expected = { grade: 9 }
  assert.deepEqual(extractJson('{"grade": 9}'), expected)
  assert.deepEqual(extractJson('```json\n{"grade": 9}\n```'), expected)
  assert.deepEqual(extractJson('Segue o resultado:\n{"grade": 9}\nBom trabalho!'), expected)
  assert.throws(() => extractJson('sem json aqui'), (error) => error instanceof AtaAssistantError && error.status === 502)
  assert.throws(() => extractJson('{"grade": '), (error) => error instanceof AtaAssistantError && error.status === 502)
})

test('mantém uma resposta correta como está', () => {
  assert.deepEqual(normalizeAtaAnalysis(JSON.parse(goodJson)), JSON.parse(goodJson))
})

test('normaliza a nota: vírgula decimal, texto e faixa de 0 a 10', () => {
  const grade = (value) => normalizeAtaAnalysis({ grade: value }).grade
  assert.equal(grade(8.5), 8.5)
  assert.equal(grade('8,5'), 8.5)
  assert.equal(grade(' 9 '), 9)
  assert.equal(grade(0), 0)
  assert.equal(grade(10), 10)
  assert.equal(grade(8.456), 8.46)
  for (const invalid of [11, -1, 85, 'oito', '8,5 pontos', '', null, undefined, NaN, Infinity, true, [], {}]) assert.equal(grade(invalid), null, String(invalid))
})

test('normaliza a indicação: só booleano ou sim/não explícito', () => {
  const nominated = (value) => normalizeAtaAnalysis({ nominated: value }).nominated
  assert.equal(nominated(true), true)
  assert.equal(nominated(false), false)
  assert.equal(nominated('Sim'), true)
  assert.equal(nominated('não'), false)
  assert.equal(nominated('true'), true)
  for (const invalid of ['talvez', '', null, undefined, 1, 0, []]) assert.equal(nominated(invalid), null, String(invalid))
})

test('normaliza a data: ISO válida, DD/MM/AAAA e o resto vira null', () => {
  assert.equal(normalizeDate('2026-10-07'), '2026-10-07')
  assert.equal(normalizeDate('7/10/2026'), '2026-10-07')
  assert.equal(normalizeDate('07/10/2026'), '2026-10-07')
  for (const invalid of ['2026-02-30', '2026-13-01', '31/04/2026', '7 de outubro de 2026', '', null, 20261007, undefined]) assert.equal(normalizeDate(invalid), null, String(invalid))
})

test('limpa avaliadores: texto, sem repetição, com limites', () => {
  const evaluators = normalizeAtaAnalysis({ evaluators: [' Ana  Souza ', 'ana souza', '', 7, null, 'Bia', ...Array.from({ length: 20 }, (_, index) => `Docente ${index}`)] }).evaluators
  assert.equal(evaluators[0], 'Ana Souza')
  assert.equal(evaluators[1], 'Bia')
  assert.equal(evaluators.length, 10)
  assert.deepEqual(normalizeAtaAnalysis({ evaluators: 'Ana' }).evaluators, [])
})

test('limpa correções: objetos, textos soltos, repetidas, vazias e longas', () => {
  const long = 'Revisar '.repeat(30)
  const { corrections } = normalizeAtaAnalysis({
    corrections: [
      { title: ' Padronizar referências ', detail: ' Conferir ABNT ' },
      { title: 'padronizar referências', detail: 'duplicada' },
      { title: 'Sem detalhe' },
      { detail: 'Só detalhe' },
      'Texto solto como correção',
      { title: '', detail: '' }, {}, null, 42, [],
      { title: long, detail: 'ok' },
    ],
  })
  assert.deepEqual(corrections.slice(0, 5), [
    { title: 'Padronizar referências', detail: 'Conferir ABNT' },
    { title: 'Sem detalhe', detail: 'Sem detalhe' },
    { title: 'Só detalhe', detail: 'Só detalhe' },
    { title: 'Texto solto como correção', detail: 'Texto solto como correção' },
    { title: corrections[4].title, detail: 'ok' },
  ])
  assert.ok(corrections[4].title.length <= 90 && corrections[4].title.endsWith('…'))
  assert.equal(normalizeAtaAnalysis({ corrections: Array.from({ length: 20 }, (_, index) => ({ title: `Tarefa ${index}`, detail: 'x' })) }).corrections.length, 8)
  assert.deepEqual(normalizeAtaAnalysis({ corrections: 'nada' }).corrections, [])
})

test('normaliza a confiança e assume baixa quando ela vem fora do formato', () => {
  const confidence = (value) => normalizeAtaAnalysis({ confidence: value }).confidence
  assert.equal(confidence('alta'), 'alta')
  assert.equal(confidence('Média'), 'media')
  assert.equal(confidence('MEDIA'), 'media')
  assert.equal(confidence('baixa'), 'baixa')
  for (const invalid of ['muito alta', '', null, undefined, 3]) assert.equal(confidence(invalid), 'baixa', String(invalid))
})

test('descarta campos desconhecidos e completa os ausentes', () => {
  assert.deepEqual(normalizeAtaAnalysis({ grade: 7, apiKey: 'segredo', extra: { a: 1 } }), {
    grade: 7, nominated: null, defenseDate: null, evaluators: [], corrections: [], divergences: [], confidence: 'baixa',
  })
})

test('rejeita respostas que não são um objeto com campos esperados', () => {
  for (const raw of [null, undefined, 'texto', 42, [], [{ grade: 9 }], {}, { foo: 'bar' }]) {
    assert.throws(() => normalizeAtaAnalysis(raw), (error) => error instanceof AtaAssistantError && error.status === 502, JSON.stringify(raw))
  }
})

test('aponta a divergência de data mesmo quando o modelo não a menciona', () => {
  const base = normalizeAtaAnalysis({ defenseDate: '2026-10-08', divergences: ['Autor diferente: Davi Silva'] })
  const checked = withDateDivergence(base, context)
  assert.equal(checked.divergences.length, 2)
  assert.match(checked.divergences[1], /08\/10\/2026.*07\/10\/2026/)
  // sem duplicar quando o modelo já falou da data, ou quando as datas coincidem ou faltam
  assert.equal(withDateDivergence({ ...base, divergences: ['A data da ata difere do cadastro.'] }, context).divergences.length, 1)
  assert.equal(withDateDivergence({ ...base, defenseDate: '2026-10-07' }, context).divergences.length, 1)
  assert.equal(withDateDivergence({ ...base, defenseDate: null }, context).divergences.length, 1)
  assert.equal(withDateDivergence(base, { ...context, defenseDate: '' }).divergences.length, 1)
})

/* ---------------------------- Chamada ao modelo ---------------------------- */

test('chama a OpenRouter com chave, cabeçalhos e parâmetros esperados', async () => {
  const { impl, calls } = fakeFetch(() => okResponse(goodJson))
  const analysis = await analyzeAta(parseAtaRequest({ ataText, context }), { apiKey: FAKE_KEY, referer: 'https://integrae.example', fetchImpl: impl })
  assert.equal(analysis.grade, 8.5)
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
  assert.equal(body.max_tokens, 800)
  assert.deepEqual(body.response_format, { type: 'json_object' })
  assert.ok(!JSON.stringify(body).includes(FAKE_KEY))
})

test('usa o modelo configurado e normaliza a resposta suja do modelo', async () => {
  const { impl, calls } = fakeFetch(() => okResponse('```json\n{"grade":"9,0","nominated":"sim","defenseDate":"08/10/2026","confidence":"Média"}\n```'))
  const analysis = await analyzeAta(parseAtaRequest({ ataText, context }), { apiKey: FAKE_KEY, model: 'provedor/outro-modelo', fetchImpl: impl })
  assert.equal(calls[0].body.model, 'provedor/outro-modelo')
  assert.equal(analysis.grade, 9)
  assert.equal(analysis.nominated, true)
  assert.equal(analysis.defenseDate, '2026-10-08')
  assert.equal(analysis.confidence, 'media')
  assert.equal(analysis.divergences.length, 1)
})

test('sem chave configurada responde 503 e não chama a rede', async () => {
  const { impl, calls } = fakeFetch(() => okResponse(goodJson))
  for (const apiKey of [undefined, '', '   ']) {
    await expectError(analyzeAta(parseAtaRequest({ ataText, context }), { apiKey, fetchImpl: impl }), 503, /OPENROUTER_API_KEY/)
  }
  assert.equal(calls.length, 0)
})

test('erros do provedor viram mensagens seguras, sem detalhes internos', async () => {
  const request = parseAtaRequest({ ataText, context })
  const run = (handler) => analyzeAta(request, { apiKey: FAKE_KEY, fetchImpl: fakeFetch(handler).impl })
  await expectError(run(() => failResponse(401)), 502, /indisponível/)
  await expectError(run(() => failResponse(402)), 502, /indisponível/)
  await expectError(run(() => failResponse(500)), 502, /indisponível/)
  await expectError(run(() => failResponse(429)), 429, /Muitas solicitações/)
  await expectError(run(() => failResponse(408)), 504, /demorou/)
  await expectError(run(() => { throw new TypeError(`fetch failed ${FAKE_KEY}`) }), 502, /indisponível/)
  await expectError(run(() => { throw Object.assign(new Error('timeout'), { name: 'TimeoutError' }) }), 504, /demorou/)
  await expectError(run(() => { throw Object.assign(new Error('abort'), { name: 'AbortError' }) }), 504, /demorou/)
})

test('respostas vazias ou fora do formato viram 502', async () => {
  const request = parseAtaRequest({ ataText, context })
  const run = (handler) => analyzeAta(request, { apiKey: FAKE_KEY, fetchImpl: fakeFetch(handler).impl })
  await expectError(run(() => okResponse('')), 502, /não devolveu/)
  await expectError(run(() => okResponse('Desculpe, não consegui ler a ata.')), 502, /não pôde ser lida/)
  await expectError(run(() => okResponse('{"foo": 1}')), 502, /fora do formato/)
  await expectError(run(() => ({ ok: true, status: 200, json: async () => ({ choices: [] }) })), 502, /não devolveu/)
  await expectError(run(() => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: ['x'] } }] }) })), 502, /não devolveu/)
  await expectError(run(() => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('json') } })), 502, /indisponível/)
})

test('o log do servidor redige a chave e não inclui o texto da ata', async () => {
  const log = mock.method(console, 'error', () => {})
  try {
    const request = parseAtaRequest({ ataText, context })
    await assert.rejects(analyzeAta(request, { apiKey: FAKE_KEY, fetchImpl: fakeFetch(() => failResponse(401)).impl }))
    await assert.rejects(analyzeAta(request, { apiKey: FAKE_KEY, fetchImpl: fakeFetch(() => { throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'SELF_SIGNED_CERT_IN_CHAIN' } }) }).impl }))
    const lines = log.mock.calls.map((call) => call.arguments.join(' '))
    assert.equal(lines.length, 2)
    assert.ok(lines[0].endsWith('HTTP 401: detalhe interno [chave]'), lines[0])
    assert.match(lines[1], /SELF_SIGNED_CERT_IN_CHAIN/)
    for (const line of lines) assert.ok(!line.includes(FAKE_KEY) && !line.includes('FATEC BAURU'))
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
  const response = { statusCode: 200, headers: {}, payload: '', setHeader(name, value) { this.headers[name] = value }, end(text) { this.payload = text ?? '' } }
  return response
}
const jsonBody = (response) => JSON.parse(response.payload)

test('POST válido devolve 200 com a análise em JSON', async () => {
  const { impl } = fakeFetch(() => okResponse(goodJson))
  const response = fakeResponse()
  const bytes = new TextEncoder().encode(JSON.stringify({ ataText, context }))
  await handleAtaAssistantRequest(fakeRequest({ raw: [bytes.slice(0, 50), bytes.slice(50)] }), response, { apiKey: FAKE_KEY, fetchImpl: impl })
  assert.equal(response.statusCode, 200)
  assert.match(response.headers['Content-Type'], /application\/json/)
  assert.equal(jsonBody(response).grade, 8.5)
  assert.ok(!response.payload.includes(FAKE_KEY))
})

test('aceita o corpo já interpretado pela Vercel (objeto ou texto)', async () => {
  for (const body of [{ ataText, context }, JSON.stringify({ ataText, context })]) {
    const response = fakeResponse()
    await handleAtaAssistantRequest(fakeRequest({ body }), response, { apiKey: FAKE_KEY, fetchImpl: fakeFetch(() => okResponse(goodJson)).impl })
    assert.equal(response.statusCode, 200)
  }
})

test('só aceita POST', async () => {
  const response = fakeResponse()
  await handleAtaAssistantRequest(fakeRequest({ method: 'GET' }), response, { apiKey: FAKE_KEY, fetchImpl: fakeFetch(() => okResponse(goodJson)).impl })
  assert.equal(response.statusCode, 405)
  assert.equal(response.headers.Allow, 'POST')
  assert.equal(typeof jsonBody(response).error, 'string')
})

test('sem chave devolve 503 com a mensagem de configuração', async () => {
  const response = fakeResponse()
  await handleAtaAssistantRequest(fakeRequest({ raw: JSON.stringify({ ataText, context }) }), response, { apiKey: undefined })
  assert.equal(response.statusCode, 503)
  assert.deepEqual(jsonBody(response), { error: 'IA indisponível: configure OPENROUTER_API_KEY no servidor' })
})

test('texto grande demais devolve 413, antes de chamar a IA', async () => {
  const { impl, calls } = fakeFetch(() => okResponse(goodJson))
  let response = fakeResponse()
  await handleAtaAssistantRequest(fakeRequest({ raw: JSON.stringify({ ataText: 'a'.repeat(MAX_ATA_CHARS + 1), context }) }), response, { apiKey: FAKE_KEY, fetchImpl: impl })
  assert.equal(response.statusCode, 413)
  assert.match(jsonBody(response).error, /15\.000/)
  response = fakeResponse()
  await handleAtaAssistantRequest(fakeRequest({ raw: JSON.stringify({ ataText: 'a'.repeat(500_000), context }) }), response, { apiKey: FAKE_KEY, fetchImpl: impl })
  assert.equal(response.statusCode, 413)
  assert.equal(calls.length, 0)
})

test('JSON inválido devolve 400 em português', async () => {
  const response = fakeResponse()
  await handleAtaAssistantRequest(fakeRequest({ raw: '{nao é json' }), response, { apiKey: FAKE_KEY })
  assert.equal(response.statusCode, 400)
  assert.match(jsonBody(response).error, /Requisição inválida/)
})

test('falha do provedor vira { error } sem expor a chave nem o detalhe', async () => {
  const response = fakeResponse()
  await handleAtaAssistantRequest(fakeRequest({ raw: JSON.stringify({ ataText, context }) }), response, { apiKey: FAKE_KEY, fetchImpl: fakeFetch(() => failResponse(401)).impl })
  assert.equal(response.statusCode, 502)
  assert.deepEqual(Object.keys(jsonBody(response)), ['error'])
  assert.ok(!response.payload.includes(FAKE_KEY))
  assert.ok(!response.payload.includes('detalhe interno'))
})

/* ------------------------------ Texto de exemplo ------------------------------ */

test('o texto de exemplo usa o cadastro, traz nota 8,5, indicação e 3 correções', () => {
  const text = buildSampleAta({ title: 'Acessibilidade em serviços digitais municipais', authors: ['Ana Lima', 'Bruno Costa', 'Carla Dias'], defenseDate: '2026-10-22' })
  assert.ok(text.includes('Acessibilidade em serviços digitais municipais'))
  assert.ok(text.includes('Ana Lima, Bruno Costa e Carla Dias'))
  assert.ok(text.includes('22 dias do mês de outubro de 2026'))
  assert.match(text, /nota final 8,5/)
  assert.match(text, /indica o trabalho para disponibilização integral/)
  assert.deepEqual([...text.matchAll(/^(\d)\. /gm)].map((match) => match[1]), ['1', '2', '3'])
  assert.ok(text.length < MAX_ATA_CHARS)
  assert.doesNotThrow(() => parseAtaRequest({ ataText: text, context }))
})
