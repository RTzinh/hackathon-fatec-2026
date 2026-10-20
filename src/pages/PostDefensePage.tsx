import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle, ArrowRight, Check, CheckCircle2, Download, FileCheck2, FileText, Lightbulb, Lock, MessageSquareText, Send, ShieldCheck, Sparkles, X } from 'lucide-react'
import { FilePicker } from '../components/FilePicker'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { MAX_TERM_BYTES, MAX_WORK_BYTES, checkRicFile, checkTermData, correctionDeadline, integralAllowed, libraryDeadline, ricFileName, suggestedAccessLevel } from '../domain/rules'
import type { CheckResult } from '../domain/rules'
import type { BoardDocument, CorrectionTask, DefenseBoard, FinalVersion, TermData, Work } from '../domain/types'
import { accessLabels, fundingLabels } from '../domain/labels'
import type { PageProps } from '../App'
import './PostDefensePage.css'

const SAMPLE_TERM = 'dsm_2026_2_davirocha_paineldeindicadoresparacooperativas_TA.pdf'

export function PostDefensePage({ state, setState, viewer, notify }: PageProps) {
  const boards = useMemo(() => [...state.boards].filter((board) => board.status !== 'agendada').sort((a, b) => b.date.localeCompare(a.date)), [state.boards])
  const [boardId, setBoardId] = useState(() => boards.find((board) => board.status === 'pendente-correcao')?.id ?? boards[0]?.id ?? '')
  const [adjustingDoc, setAdjustingDoc] = useState('')
  const [adjustingVersion, setAdjustingVersion] = useState('')
  const [adjustmentNote, setAdjustmentNote] = useState('')
  const [formError, setFormError] = useState('')
  const [ataForm, setAtaForm] = useState<{ grade: string; nominated: '' | 'sim' | 'nao' } | null>(null)
  const board = state.boards.find((item) => item.id === boardId)
  const work = board && state.works.find((item) => item.id === board.workId)
  const course = work && state.courses.find((item) => item.id === work.courseId)
  const authors = work ? work.authorIds.map((id) => state.users.find((user) => user.id === id)?.name).filter(Boolean) as string[] : []
  const documents = state.documents.filter((document) => document.boardId === boardId)
  const versions = work ? state.versions.filter((version) => version.workId === work.id).sort((a, b) => b.number - a.number) : []
  const tasks = work ? state.correctionTasks.filter((task) => task.workId === work.id) : []
  const deposit = work && state.deposits.find((item) => item.workId === work.id)
  const latest = versions[0]
  const approvedVersion = versions.find((version) => version.status === 'aprovada')
  const ataDocument = documents.find((document) => document.kind === 'ata') ?? { id: `new-${boardId}-ata`, boardId, kind: 'ata' as const, status: 'pendente' as const }
  const termDocument = documents.find((document) => document.kind === 'autorizacao-ric-cps') ?? { id: `new-${boardId}-ric`, boardId, kind: 'autorizacao-ric-cps' as const, status: 'pendente' as const }
  const hasAta = ataDocument.status === 'aprovado'
  const termUnlocked = hasAta && Boolean(approvedVersion)
  const hasTerm = termDocument.status === 'aprovado'
  const pendingTasks = tasks.filter((task) => task.status === 'aberta')
  const nameInput = board && work && course ? { courseCode: course.code, year: board.year, semester: board.semester, firstAuthor: authors[0] ?? '', title: work.title } : undefined
  const expectedWorkName = nameInput ? ricFileName(nameInput) : ''
  const expectedTermName = nameInput ? ricFileName(nameInput, 'termo') : ''
  const term: TermData = termDocument.term ?? { accessLevel: suggestedAccessLevel(board?.grade, board?.nominatedByBoard), fundingAgency: 'nao', correctionsDeclared: false, signatures: { authors: false, advisor: false, coordinator: false } }
  const termChecks = board ? [...checkTermData(term, board), ...checkRicFile(termDocument.file, expectedTermName, MAX_TERM_BYTES)] : []
  const forwarded = deposit && deposit.status !== 'nao-encaminhado'
  const checklist = [
    { label: hasAta ? `Ata conferida · nota ${board?.grade?.toLocaleString('pt-BR')} · ${board?.nominatedByBoard ? 'indicado' : 'não indicado'} pela banca` : ataDocument.file ? 'Conferir a Ata e registrar nota e indicação' : 'Anexar Ata de Defesa preenchida e assinada', done: hasAta },
    { label: approvedVersion ? `Aval do orientador na versão ${approvedVersion.number}` : latest ? `Avaliar versão ${latest.number} enviada pelo aluno` : 'Aguardar versão definitiva do aluno', done: Boolean(approvedVersion) },
    { label: pendingTasks.length ? `Revisar ${pendingTasks.length} tarefa(s) em aberto` : 'Tarefas de correção revisadas', done: pendingTasks.length === 0 },
    { label: hasTerm ? 'Termo de Autorização validado' : termUnlocked ? `Completar e validar o TA (${termChecks.filter((check) => !check.ok).length} item(ns) pendente(s))` : 'TA libera após ata conferida e aval da versão', done: hasTerm },
    { label: forwarded ? `Pacote encaminhado à biblioteca em ${new Date(deposit!.sentToLibraryAt!).toLocaleDateString('pt-BR')}` : 'Encaminhar versão final e TA à biblioteca', done: Boolean(forwarded) },
  ]

  function addHistory(label: string, detail: string, at = new Date().toISOString()) {
    if (!board) return
    setState((current) => ({ ...current, history: [...current.history, { id: `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, boardId: board.id, at, actorId: viewer.id, label, detail }] }))
  }
  function updateDocument(document: BoardDocument, changes: Partial<BoardDocument>) {
    setState((current) => ({ ...current, documents: current.documents.some((item) => item.id === document.id)
      ? current.documents.map((item) => item.id === document.id ? { ...item, ...changes } : item)
      : [...current.documents, { ...document, ...changes }] }))
  }
  function selectFile(document: BoardDocument, file: NonNullable<BoardDocument['file']>) {
    updateDocument(document, { file, status: 'enviado', note: undefined, requestedAt: undefined })
    addHistory(document.kind === 'ata' ? 'Ata anexada' : 'Termo de Autorização anexado', `${file.name} foi selecionado; os metadados foram guardados localmente.`, file.selectedAt)
    notify({ kind: 'success', message: 'Metadados do documento registrados.' })
  }
  function askForDocumentAdjustments(event: FormEvent<HTMLFormElement>, document: BoardDocument) {
    event.preventDefault()
    if (!adjustmentNote.trim()) { setFormError('Descreva o ajuste solicitado.'); return }
    updateDocument(document, { status: 'ajustes-solicitados', note: adjustmentNote.trim(), requestedAt: new Date().toISOString() })
    setAdjustingDoc(''); setAdjustmentNote(''); setFormError('')
    notify({ kind: 'success', message: 'Solicitação de ajuste registrada no histórico do documento.' })
  }
  function approveAta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!board || !ataForm) return
    const grade = Number(ataForm.grade.replace(',', '.'))
    if (!ataDocument.file) { setFormError('Anexe a ata antes de registrar a conferência.'); return }
    if (!ataForm.grade.trim() || Number.isNaN(grade) || grade < 0 || grade > 10) { setFormError('Informe a nota da ata, de 0 a 10.'); return }
    if (!ataForm.nominated) { setFormError('Informe se a banca indicou o trabalho para disponibilização integral.'); return }
    const nominated = ataForm.nominated === 'sim'
    const deadline = correctionDeadline(board.date)
    updateDocument(ataDocument, { status: 'aprovado', note: undefined })
    setState((current) => ({ ...current, boards: current.boards.map((item) => item.id === board.id ? { ...item, grade, nominatedByBoard: nominated, status: item.status === 'realizada' ? 'pendente-correcao' : item.status } : item) }))
    addHistory('Ata conferida', `Nota ${grade.toLocaleString('pt-BR')} e ${nominated ? 'indicação' : 'sem indicação'} da banca registradas. Prazo de correção até ${deadline.split('-').reverse().join('/')}.`)
    setAtaForm(null); setFormError('')
    notify({ kind: 'success', message: 'Ata conferida. Nota e indicação seguem para o Termo de Autorização.' })
  }
  function reviewVersion(version: FinalVersion, status: 'aprovada' | 'ajustes-solicitados', note?: string) {
    if (!board || !work) return
    if (status === 'ajustes-solicitados' && !note?.trim()) { setFormError('Descreva os ajustes solicitados para esta versão.'); return }
    const now = new Date().toISOString()
    setState((current) => ({
      ...current,
      versions: current.versions.map((item) => item.id === version.id ? { ...item, status, reviewedAt: now, reviewedBy: viewer.id, reviewNote: note?.trim() || (status === 'aprovada' ? 'Aval do orientador registrado para esta versão.' : undefined) } : item),
    }))
    addHistory(status === 'aprovada' ? `Versão ${version.number} aprovada` : `Ajustes solicitados na versão ${version.number}`, status === 'aprovada' ? `Aval registrado somente para a versão ${version.number} (${version.file.name}).` : note!.trim(), now)
    setAdjustingVersion(''); setAdjustmentNote(''); setFormError('')
    notify({ kind: 'success', message: status === 'aprovada' ? `Versão ${version.number} aprovada. O Termo de Autorização foi liberado.` : `Ajustes registrados para a versão ${version.number}.` })
  }
  function updateTerm(changes: Partial<TermData>) {
    updateDocument(termDocument, { term: { ...term, ...changes } })
  }
  function approveTerm() {
    if (!board) return
    const failing = termChecks.filter((check) => !check.ok)
    if (failing.length) { notify({ kind: 'error', message: `Validação pendente: ${failing.map((check) => check.label).join('; ')}.` }); return }
    if (!window.confirm('Registrar a validação do Termo de Autorização e concluir a banca?')) return
    updateDocument(termDocument, { status: 'aprovado', note: undefined, term })
    setState((current) => ({ ...current, boards: current.boards.map((item) => item.id === board.id ? { ...item, status: 'concluida' } : item) }))
    addHistory('Termo de Autorização validado', `Formato, nome, campos e assinaturas conferidos. Acesso: ${accessLabels[term.accessLevel]}. Banca concluída.`)
    notify({ kind: 'success', message: 'TA validado e banca concluída. Falta encaminhar o pacote à biblioteca.' })
  }
  function forwardPackage() {
    if (!work || !board || !approvedVersion || !termDocument.file) return
    if (!window.confirm('Registrar o encaminhamento do pacote à biblioteca, com cópia do TA à Diretoria de Serviços Acadêmicos? Nenhum e-mail será enviado.')) return
    const now = new Date().toISOString()
    const packageFiles = [approvedVersion.file.name, termDocument.file.name]
    setState((current) => ({ ...current, deposits: [...current.deposits.filter((item) => item.workId !== work.id), { workId: work.id, status: 'encaminhado', forwardedBy: viewer.id, sentToLibraryAt: now, academicServicesCopy: true, packageFiles }] }))
    addHistory('Pacote encaminhado à biblioteca', `${packageFiles.join(' + ')}; cópia do TA à Diretoria de Serviços Acadêmicos (registro demonstrativo).`, now)
    notify({ kind: 'success', message: 'Pacote na fila da biblioteca. A submissão no RIC-CPS é feita pelo bibliotecário.' })
  }
  function updateTask(task: CorrectionTask, status: CorrectionTask['status']) {
    setState((current) => ({ ...current, correctionTasks: current.correctionTasks.map((item) => item.id === task.id ? { ...item, status, reviewedBy: status === 'revisada' ? viewer.id : item.reviewedBy } : item) }))
    notify({ kind: 'success', message: status === 'revisada' ? 'Sugestão registrada como revisada pelo orientador.' : 'Tarefa de correção atualizada.' })
  }

  function documentControls(document: BoardDocument) {
    return <>
      {document.note && <div className="document-adjustment"><AlertCircle size={14} /><span>Ajuste solicitado: {document.note}</span></div>}
      {document.status !== 'aprovado' && <FilePicker label={document.file ? 'Substituir arquivo' : 'Selecionar arquivo'} file={document.file} onSelect={(file) => selectFile(document, file)} />}
      {document.status === 'aprovado' && document.file && <p className="document-approved-file"><CheckCircle2 size={14} /> {document.file.name}</p>}
      {document.status !== 'aprovado' && document.status !== 'ajustes-solicitados' && <div className="document-actions"><button className="text-button" onClick={() => { setAdjustingDoc(adjustingDoc === document.id ? '' : document.id); setFormError(''); setAdjustmentNote('') }}><MessageSquareText size={14} /> Solicitar ajuste</button></div>}
      {adjustingDoc === document.id && <form className="adjustment-form" onSubmit={(event) => askForDocumentAdjustments(event, document)}><label htmlFor={`doc-note-${document.id}`}>Descreva o que falta</label><textarea id={`doc-note-${document.id}`} value={adjustmentNote} onChange={(event) => setAdjustmentNote(event.target.value)} rows={2} placeholder="Ex.: faltam assinaturas na página final" />{formError && <span className="form-error" role="alert">{formError}</span>}<div><button className="button button--small" type="button" onClick={() => setAdjustingDoc('')}>Cancelar</button><button className="button button--small button--primary" type="submit">Registrar solicitação</button></div></form>}
    </>
  }

  return <>
    <PageHeader title="Pós-banca e documentos" description="Ata, versão final, Termo de Autorização e encaminhamento à biblioteca, na ordem da Portaria CEETEPS-GDS 4069/2024." actions={<label className="board-picker"><span>Banca</span><select value={boardId} onChange={(event) => { setBoardId(event.target.value); setAtaForm(null); setFormError('') }}>{boards.map((item) => <option key={item.id} value={item.id}>{state.works.find((workItem) => workItem.id === item.workId)?.title}</option>)}</select></label>} />
    {board && work ? <>
      <section className="post-work-strip"><div><span>{course?.code} · Defesa em {new Date(`${board.date}T12:00:00`).toLocaleDateString('pt-BR')} · {work.workType}</span><strong>{work.title}</strong><small>{authors.join(' e ')}</small></div><StatusBadge status={board.status} /></section>
      <div className="post-grid">
        <div className="post-primary">
          <section className="panel documents-panel"><div className="panel-heading"><div><h2><span className="step-number">1</span> Ata de Defesa</h2><p>A conferência registra a nota e a indicação da banca, usadas no TA.</p></div><StatusBadge status={ataDocument.status} /></div>
            <div className="document-list"><article className="document-row">
              {documentControls(ataDocument)}
              {ataDocument.file && !hasAta && !ataForm && <div className="document-actions"><button className="button button--small button--primary" onClick={() => { setAtaForm({ grade: board.grade?.toString().replace('.', ',') ?? '', nominated: board.nominatedByBoard === undefined ? '' : board.nominatedByBoard ? 'sim' : 'nao' }); setFormError('') }}><ShieldCheck size={14} /> Conferir ata</button></div>}
              {ataForm && <form className="adjustment-form ata-form" onSubmit={approveAta}>
                <div className="ata-fields"><label>Nota registrada na ata<input inputMode="decimal" value={ataForm.grade} onChange={(event) => setAtaForm({ ...ataForm, grade: event.target.value })} placeholder="Ex.: 9,0" /></label>
                  <label>Indicação para disponibilização integral<select value={ataForm.nominated} onChange={(event) => setAtaForm({ ...ataForm, nominated: event.target.value as 'sim' | 'nao' })}><option value="">Selecione</option><option value="sim">Sim, a banca indicou</option><option value="nao">Não indicou</option></select></label></div>
                <p className="ata-hint"><Lightbulb size={13} /> Nota ≥ 9 com indicação permite texto integral no RIC-CPS (Art. 14).</p>
                {formError && <span className="form-error" role="alert">{formError}</span>}
                <div><button className="button button--small" type="button" onClick={() => setAtaForm(null)}>Cancelar</button><button className="button button--small button--primary" type="submit">Registrar conferência</button></div>
              </form>}
            </article></div>
          </section>

          <section className="panel final-review-panel"><div className="panel-heading"><div><h2><span className="step-number">2</span> Versões definitivas</h2><p>O aval vale para uma versão específica. Nome esperado: <code>{expectedWorkName}</code></p></div><span className="flow-caption">{versions.length} versão(ões)</span></div>
            {versions.length === 0 ? <div className="empty-state"><span><FileText size={18} /></span><div><strong>O aluno ainda não enviou versão</strong><p>A versão aparecerá aqui após o envio pelo perfil de aluno.</p></div></div> : <div className="review-list">{versions.map((version) => <article className={`review-version ${latest?.id === version.id ? 'review-version--latest' : ''}`} key={version.id}>
              <div className="version-badge">v{version.number}</div><div className="review-version__content"><div className="review-version__title"><strong>{version.file.name}</strong><StatusBadge status={version.status} />{latest?.id === version.id && <span className="latest-tag">Mais recente</span>}</div><span>{new Date(version.submittedAt).toLocaleString('pt-BR')} · {formatSize(version.file.size)}</span>
                <CheckChips checks={checkRicFile(version.file, expectedWorkName, MAX_WORK_BYTES)} />
                {version.reviewNote && <p>{version.reviewNote}</p>}{version.reviewedBy && <small>Revisada por {state.users.find((user) => user.id === version.reviewedBy)?.name}</small>}
                {version.status === 'enviada' && <div className="review-actions"><button className="button button--small button--primary" onClick={() => { if (window.confirm(`Registrar aval do orientador para a versão ${version.number}?`)) reviewVersion(version, 'aprovada') }}><CheckCircle2 size={14} /> Aprovar esta versão</button><button className="text-button" onClick={() => { setAdjustingVersion(adjustingVersion === version.id ? '' : version.id); setAdjustmentNote(''); setFormError('') }}><MessageSquareText size={14} /> Solicitar ajustes</button></div>}
                {adjustingVersion === version.id && <form className="adjustment-form" onSubmit={(event) => { event.preventDefault(); reviewVersion(version, 'ajustes-solicitados', adjustmentNote) }}><label htmlFor={`version-note-${version.id}`}>Ajustes para a versão {version.number}</label><textarea id={`version-note-${version.id}`} value={adjustmentNote} onChange={(event) => setAdjustmentNote(event.target.value)} rows={2} placeholder="Descreva o que deve ser revisto" />{formError && <span className="form-error" role="alert">{formError}</span>}<div><button className="button button--small" type="button" onClick={() => setAdjustingVersion('')}>Cancelar</button><button className="button button--small button--primary" type="submit">Registrar ajustes</button></div></form>}
              </div>
            </article>)}</div>}
          </section>

          <section className="panel corrections-review-panel"><div className="panel-heading"><div><h2>Tarefas de correção</h2><p>Sugestões de IA ficam pendentes de revisão humana.</p></div><Sparkles size={18} className="section-icon" /></div>
            <div className="review-task-list">{tasks.length ? tasks.map((task) => <article className="review-task" key={task.id}><span className={`review-task__source ${task.source === 'sugestao-ia' ? 'review-task__source--ai' : ''}`}>{task.source === 'sugestao-ia' ? <Sparkles size={15} /> : <CheckCircle2 size={15} />}</span><div><div className="review-task__title"><strong>{task.title}</strong><StatusBadge status={task.status} /></div><p>{task.detail}</p><small>{task.source === 'sugestao-ia' ? 'Sugestão simulada · requer revisão do orientador' : 'Correção indicada pela banca'}</small></div>{task.source === 'sugestao-ia' && task.status === 'aberta' && <button className="button button--small" onClick={() => updateTask(task, 'revisada')}>Revisar sugestão</button>}{task.status !== 'concluida' && task.source === 'banca' && <button className="icon-button icon-button--small" aria-label={`Marcar ${task.title} como concluída`} onClick={() => updateTask(task, 'concluida')}><Check size={15} /></button>}</article>) : <div className="empty-state"><span><CheckCircle2 size={18} /></span><div><strong>Sem tarefas cadastradas</strong><p>As tarefas de correção ficarão ligadas ao trabalho selecionado.</p></div></div>}</div>
            <div className="ai-disclaimer"><Lightbulb size={15} /> Sugestões de IA são exemplos fixos; nenhum modelo externo é chamado. As validações de nome, PDF/A, campos e assinaturas são regras determinísticas, não IA.</div>
          </section>

          <section className={`panel documents-panel ${termUnlocked ? '' : 'panel--locked'}`}><div className="panel-heading"><div><h2><span className="step-number">3</span> Termo de Autorização RIC-CPS</h2><p>Modelo do Anexo C · nome esperado: <code>{expectedTermName}</code></p></div><StatusBadge status={termDocument.status} /></div>
            {!termUnlocked ? <div className="locked-note"><Lock size={16} /><p>O TA traz a nota, a indicação da banca e a declaração de que as correções foram feitas. Ele é liberado depois da <strong>ata conferida</strong> e do <strong>aval de uma versão final</strong>.</p></div> : <div className="document-list"><article className="document-row">
              <div className="term-grid">
                <dl className="term-prefill">
                  <div><dt>Curso</dt><dd>{course?.name}</dd></div><div><dt>Tipo</dt><dd>{work.workType}</dd></div>
                  <div><dt>Produto complementar</dt><dd>{work.hasProduct ? 'Sim' : 'Não'}</dd></div><div><dt>Orientador</dt><dd>{state.users.find((user) => user.id === work.advisorId)?.name}</dd></div>
                  <div><dt>Data da defesa</dt><dd>{new Date(`${board.date}T12:00:00`).toLocaleDateString('pt-BR')}</dd></div><div><dt>Nota · indicação</dt><dd>{board.grade?.toLocaleString('pt-BR')} · {board.nominatedByBoard ? 'indicado' : 'não indicado'}</dd></div>
                </dl>
                <div className="term-fields">
                  <label>Acesso ao texto integral<select disabled={hasTerm} value={term.accessLevel} onChange={(event) => updateTerm({ accessLevel: event.target.value as TermData['accessLevel'] })}>{(Object.keys(accessLabels) as TermData['accessLevel'][]).map((level) => <option key={level} value={level} disabled={level === 'integral' && !integralAllowed(board.grade, board.nominatedByBoard)}>{accessLabels[level]}</option>)}</select><small>Sugerido pela regra: {accessLabels[suggestedAccessLevel(board.grade, board.nominatedByBoard)].toLowerCase()}. A decisão é dos autores.</small></label>
                  {term.accessLevel === 'embargo' && <label>Embargo até<input type="date" disabled={hasTerm} value={term.embargoUntil ?? ''} onChange={(event) => updateTerm({ embargoUntil: event.target.value || undefined })} /></label>}
                  <label>Agência de fomento<select disabled={hasTerm} value={term.fundingAgency} onChange={(event) => updateTerm({ fundingAgency: event.target.value as TermData['fundingAgency'] })}>{(Object.keys(fundingLabels) as TermData['fundingAgency'][]).map((agency) => <option key={agency} value={agency}>{fundingLabels[agency]}</option>)}</select></label>
                  <label className="term-check"><input type="checkbox" disabled={hasTerm} checked={term.correctionsDeclared} onChange={(event) => updateTerm({ correctionsDeclared: event.target.checked })} /> Autores declaram que as correções da banca foram realizadas</label>
                  <fieldset className="term-signatures"><legend>Assinaturas no documento</legend>
                    <label className="term-check"><input type="checkbox" disabled={hasTerm} checked={term.signatures.authors} onChange={(event) => updateTerm({ signatures: { ...term.signatures, authors: event.target.checked } })} /> Autores</label>
                    <label className="term-check"><input type="checkbox" disabled={hasTerm} checked={term.signatures.advisor} onChange={(event) => updateTerm({ signatures: { ...term.signatures, advisor: event.target.checked } })} /> Orientador</label>
                    <span className={`term-check term-check--readonly ${term.signatures.coordinator ? 'term-check--ok' : ''}`}>{term.signatures.coordinator ? <Check size={13} /> : <X size={13} />} Coordenador do curso · {term.signatures.coordinator ? `confirmada por ${state.users.find((user) => user.id === term.coordinatorSignedBy)?.name}` : 'confirmada no perfil Coordenação'}</span>
                  </fieldset>
                </div>
              </div>
              <div className="document-actions document-actions--flush"><button className="button button--small" onClick={() => downloadTermDraft({ board, work, course: course?.name ?? '', authors, advisor: state.users.find((user) => user.id === work.advisorId)?.name ?? '', term, fileName: expectedTermName })}><Download size={14} /> Baixar TA pré-preenchido</button>{expectedTermName === SAMPLE_TERM && <a className="inline-link" href={`/amostras/${SAMPLE_TERM}`} download>Amostra de TA em PDF/A</a>}<a className="inline-link" href="/amostras/termo-sem-pdfa.pdf" download>Amostra inválida</a></div>
              {documentControls(termDocument)}
              <CheckList checks={termChecks} />
              {!hasTerm && <div className="document-actions document-actions--flush"><button className="button button--small button--primary" onClick={approveTerm} disabled={termChecks.some((check) => !check.ok)}><ShieldCheck size={14} /> Validar TA e concluir banca</button></div>}
            </article></div>}
            <p className="document-footnote"><AlertCircle size={14} /> A checagem de PDF/A procura a declaração nos metadados XMP; não substitui um validador completo. Autenticidade de assinaturas não é verificada.</p>
          </section>

          <section className={`panel documents-panel ${hasTerm ? '' : 'panel--locked'}`}><div className="panel-heading"><div><h2><span className="step-number">4</span> Encaminhamento à biblioteca</h2><p>O orientador envia; o bibliotecário submete no RIC-CPS (Arts. 10 e 11).</p></div>{deposit && <StatusBadge status={deposit.status} />}</div>
            <div className="deposit-step">
              <p>Prazo da unidade: até <strong>{formatDate(libraryDeadline(board.semester, board.year))}</strong> (90 dias após o fim do {board.semester}º semestre de {board.year}, calendário demonstrativo).</p>
              {forwarded ? <p className="document-approved-file"><CheckCircle2 size={14} /> {deposit!.packageFiles?.join(' + ')} · cópia do TA à Diretoria de Serviços Acadêmicos</p>
                : <button className="button button--small button--primary" disabled={!hasTerm} onClick={forwardPackage}><Send size={14} /> Encaminhar pacote à biblioteca</button>}
            </div>
          </section>
        </div>
        <aside className="panel checklist-panel"><div className="checklist-heading"><span><CheckCircle2 size={17} /></span><div><h2>O que falta para encerrar</h2><p>Ordem da Portaria 4069/2024</p></div></div><div className="checklist-items">{checklist.map((item) => <div className={`checklist-item ${item.done ? 'checklist-item--done' : ''}`} key={item.label}><span>{item.done ? <Check size={13} /> : <span className="checklist-empty" />}</span><p>{item.label}</p></div>)}</div><div className="checklist-count"><strong>{checklist.filter((item) => !item.done).length}</strong><span>pendência(s) nesta trilha</span></div>
          <div className="checklist-deadlines"><div><span>Versão corrigida (15 dias)</span><strong>{formatDate(correctionDeadline(board.date))}</strong></div><div><span>Envio à biblioteca (90 dias)</span><strong>{formatDate(libraryDeadline(board.semester, board.year))}</strong></div></div>
          <div className="checklist-info"><AlertCircle size={14} /><span>“Concluída” nesta demonstração = aval da versão + TA validado. Decisão de projeto a confirmar com a coordenação.</span></div><button className="text-button checklist-history" onClick={() => notify({ kind: 'info', message: `${state.history.filter((event) => event.boardId === board.id).length} evento(s) registrados para esta banca.` })}>Ver resumo do histórico <ArrowRight size={14} /></button></aside>
      </div>
    </> : <div className="panel empty-page"><span className="empty-page__icon"><FileCheck2 size={22} /></span><h2>Nenhuma banca pós-defesa</h2><p>Registre a realização de uma banca na agenda antes de abrir a conferência documental.</p></div>}
  </>
}

export function CheckList({ checks }: { checks: CheckResult[] }) {
  return <ul className="check-list" aria-label="Validação automática">{checks.map((check) => <li key={check.id} className={check.ok ? 'check-list__ok' : 'check-list__fail'}><span>{check.ok ? <Check size={12} /> : <X size={12} />}</span><div><strong>{check.label}</strong><small>{check.detail}</small></div></li>)}</ul>
}

export function CheckChips({ checks }: { checks: CheckResult[] }) {
  return <div className="check-chips">{checks.map((check) => <span key={check.id} title={check.detail} className={check.ok ? 'check-chip check-chip--ok' : 'check-chip check-chip--fail'}>{check.ok ? <Check size={10} /> : <X size={10} />}{check.label}</span>)}</div>
}

function downloadTermDraft({ board, work, course, authors, advisor, term, fileName }: { board: DefenseBoard; work: Work; course: string; authors: string[]; advisor: string; term: TermData; fileName: string }) {
  const escape = (text: string) => text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!)
  const rows: Array<[string, string]> = [
    ['Curso', course], ['Título', work.title], ['Tipo do trabalho', work.workType], ['Produto complementar', work.hasProduct ? 'Sim' : 'Não'],
    ['Unidade', 'Fatec Bauru'], ['Município', 'Bauru'], ['Orientador', advisor], ['Autores', authors.join(', ')],
    ['Data da defesa', board.date.split('-').reverse().join('/')], ['Nota', board.grade?.toLocaleString('pt-BR') ?? ''],
    ['Indicação da banca para disponibilização integral', board.nominatedByBoard ? 'Sim' : 'Não'],
    ['Acesso', accessLabels[term.accessLevel] + (term.accessLevel === 'embargo' && term.embargoUntil ? ` (até ${term.embargoUntil.split('-').reverse().join('/')})` : '')],
    ['Agência de fomento', fundingLabels[term.fundingAgency]], ['Arquivo final esperado', fileName],
  ]
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Rascunho do Termo de Autorização</title><style>body{font:14px/1.5 sans-serif;max-width:720px;margin:40px auto;color:#1d2a30}table{border-collapse:collapse;width:100%}td{border:1px solid #ccd;padding:6px 8px;vertical-align:top}td:first-child{width:38%;font-weight:600}.warn{padding:10px;background:#fbf3e2;border:1px solid #e3cf9f}.sign{margin-top:36px;display:grid;gap:32px}.sign div{border-top:1px solid #333;padding-top:4px}</style>
<p class="warn">Rascunho gerado pelo SIG-Banca (demonstração). Use o modelo oficial do Anexo C da Portaria CEETEPS-GDS nº 4069/2024 para coletar as assinaturas.</p>
<h1>Termo de Autorização para disponibilização no RIC-CPS</h1><table>${rows.map(([label, value]) => `<tr><td>${escape(label)}</td><td>${escape(value)}</td></tr>`).join('')}</table>
<p>Declaro(amos) que todas as correções solicitadas pela banca examinadora foram realizadas e que a versão final foi entregue.</p>
<div class="sign">${authors.map((author) => `<div>${escape(author)} · autor(a)</div>`).join('')}<div>${escape(advisor)} · orientador(a)</div><div>Coordenador(a) do curso</div></div></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName.replace(/\.pdf$/, '_rascunho.html')
  link.click()
  URL.revokeObjectURL(url)
}

function formatDate(date: string) { return date.split('-').reverse().join('/') }
function formatSize(size: number) { return size >= 1_048_576 ? `${(size / 1_048_576).toFixed(2)} MB` : `${(size / 1024).toFixed(1)} KB` }
