import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { AlertCircle, Check, CheckCircle2, Download, FileCheck2, Lock, MessageSquareText, Send, ShieldCheck, Sparkles, X } from 'lucide-react'
import { AtaAssistant } from '../components/AtaAssistant'
import { ComplianceReview } from '../components/ComplianceReview'
import type { ComplianceTaskDraft } from '../components/ComplianceReview'
import { FilePicker } from '../components/FilePicker'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { MAX_TERM_BYTES, MAX_WORK_BYTES, checkRicFile, checkTermData, correctionDeadline, daysBetween, integralAllowed, libraryDeadline, ricFileName, suggestedAccessLevel } from '../domain/rules'
import type { CheckResult } from '../domain/rules'
import type { BoardDocument, CorrectionTask, DefenseBoard, FinalVersion, TermData, Work } from '../domain/types'
import { accessLabels, fundingLabels } from '../domain/labels'
import type { PageProps } from '../App'
import type { ComplianceContext } from '../../server/compliance-review'
import './PostDefensePage.css'

const SAMPLE_TERM = 'dsm_2026_2_davirocha_paineldeindicadoresparacooperativas_TA.pdf'
type Step = 'ata' | 'versao' | 'termo' | 'biblioteca'

export function PostDefensePage({ state, setState, viewer, notify, focus }: PageProps) {
  const boards = useMemo(() => [...state.boards].filter((board) => board.status !== 'agendada').sort((a, b) => b.date.localeCompare(a.date)), [state.boards])
  const [boardId, setBoardId] = useState(() => boards.find((board) => board.id === focus)?.id ?? boards.find((board) => board.status === 'pendente-correcao')?.id ?? boards[0]?.id ?? '')
  const [openStep, setOpenStep] = useState<Step | null>(null)
  const [adjustingDoc, setAdjustingDoc] = useState('')
  const [adjustingVersion, setAdjustingVersion] = useState('')
  const [adjustmentNote, setAdjustmentNote] = useState('')
  const [formError, setFormError] = useState('')
  const [ataForm, setAtaForm] = useState<{ grade: string; nominated: '' | 'sim' | 'nao' } | null>(null)
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const board = state.boards.find((item) => item.id === boardId)
  const work = board && state.works.find((item) => item.id === board.workId)
  const course = work && state.courses.find((item) => item.id === work.courseId)
  const authors = work ? work.authorIds.map((id) => state.users.find((user) => user.id === id)?.name).filter(Boolean) as string[] : []
  const documents = state.documents.filter((document) => document.boardId === boardId)
  const versions = work ? state.versions.filter((version) => version.workId === work.id).sort((a, b) => b.number - a.number) : []
  const tasks = work ? state.correctionTasks.filter((task) => task.workId === work.id) : []
  const deposit = work && state.deposits.find((item) => item.workId === work.id)
  const latest = versions[0]
  const reviewableVersion = versions.find((version) => version.status === 'enviada')
  const approvedVersion = versions.find((version) => version.status === 'aprovada')
  const ataDocument = documents.find((document) => document.kind === 'ata') ?? { id: `new-${boardId}-ata`, boardId, kind: 'ata' as const, status: 'pendente' as const }
  const termDocument = documents.find((document) => document.kind === 'autorizacao-ric-cps') ?? { id: `new-${boardId}-ric`, boardId, kind: 'autorizacao-ric-cps' as const, status: 'pendente' as const }
  const hasAta = ataDocument.status === 'aprovado'
  const termUnlocked = hasAta && Boolean(approvedVersion)
  const hasTerm = termDocument.status === 'aprovado'
  const forwarded = Boolean(deposit && deposit.status !== 'nao-encaminhado')
  const nameInput = board && work && course ? { courseCode: course.code, year: board.year, semester: board.semester, firstAuthor: authors[0] ?? '', title: work.title } : undefined
  const expectedWorkName = nameInput ? ricFileName(nameInput) : ''
  const expectedTermName = nameInput ? ricFileName(nameInput, 'termo') : ''
  const term: TermData = termDocument.term ?? { accessLevel: suggestedAccessLevel(board?.grade, board?.nominatedByBoard), fundingAgency: 'nao', correctionsDeclared: false, signatures: { authors: false, advisor: false, coordinator: false } }
  const termChecks = board ? [...checkTermData(term, board), ...checkRicFile(termDocument.file, expectedTermName, MAX_TERM_BYTES)] : []
  const failingTermChecks = termChecks.filter((check) => !check.ok)
  const currentStep: Step = !hasAta ? 'ata' : !approvedVersion ? 'versao' : !hasTerm ? 'termo' : 'biblioteca'
  const activeStep = openStep ?? currentStep
  const steps: Array<{ id: Step; label: string; done: boolean; locked: boolean; summary: string }> = [
    { id: 'ata', label: 'Ata de Defesa', done: hasAta, locked: false, summary: hasAta ? `Nota ${board?.grade?.toLocaleString('pt-BR')} · ${board?.nominatedByBoard ? 'indicado' : 'não indicado'}` : ataDocument.file ? 'Aguardando conferência' : 'Anexar a ata assinada' },
    { id: 'versao', label: 'Versão final', done: Boolean(approvedVersion), locked: false, summary: approvedVersion ? `v${approvedVersion.number} aprovada` : latest?.status === 'enviada' ? `v${latest.number} para avaliar` : 'Aguardando o aluno' },
    { id: 'termo', label: 'Termo de Autorização', done: hasTerm, locked: !termUnlocked, summary: hasTerm ? 'Validado' : termUnlocked ? `${failingTermChecks.length} pendência(s)` : 'Libera após ata e aval' },
    { id: 'biblioteca', label: 'Biblioteca', done: forwarded, locked: !hasTerm, summary: forwarded ? 'Encaminhado' : hasTerm ? 'Pronto para enviar' : 'Libera após o TA' },
  ]
  const correctionDate = board ? correctionDeadline(board.date) : ''
  const correctionLeft = board ? daysBetween(today, correctionDate) : 0
  const libraryDate = board ? libraryDeadline(board.semester, board.year) : ''

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
    notify({ kind: 'success', message: `${file.name} anexado.`, undo: true })
  }
  function askForDocumentAdjustments(event: FormEvent<HTMLFormElement>, document: BoardDocument) {
    event.preventDefault()
    if (!adjustmentNote.trim()) { setFormError('Descreva o ajuste solicitado.'); return }
    updateDocument(document, { status: 'ajustes-solicitados', note: adjustmentNote.trim(), requestedAt: new Date().toISOString() })
    setAdjustingDoc(''); setAdjustmentNote(''); setFormError('')
    notify({ kind: 'success', message: 'Ajuste solicitado.', undo: true })
  }
  function approveAta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!board || !ataForm) return
    const grade = Number(ataForm.grade.replace(',', '.'))
    if (!ataDocument.file) { setFormError('Anexe a ata antes de registrar a conferência.'); return }
    if (!ataForm.grade.trim() || Number.isNaN(grade) || grade < 0 || grade > 10) { setFormError('Informe a nota da ata, de 0 a 10.'); return }
    if (!ataForm.nominated) { setFormError('Informe se a banca indicou o trabalho para disponibilização integral.'); return }
    const nominated = ataForm.nominated === 'sim'
    updateDocument(ataDocument, { status: 'aprovado', note: undefined })
    setState((current) => ({ ...current, boards: current.boards.map((item) => item.id === board.id ? { ...item, grade, nominatedByBoard: nominated, status: item.status === 'realizada' ? 'pendente-correcao' : item.status } : item) }))
    addHistory('Ata conferida', `Nota ${grade.toLocaleString('pt-BR')} e ${nominated ? 'indicação' : 'sem indicação'} da banca registradas. Prazo de correção até ${formatDate(correctionDeadline(board.date))}.`)
    setAtaForm(null); setFormError(''); setOpenStep(null)
    notify({ kind: 'success', message: 'Ata conferida. Nota e indicação seguem para o Termo de Autorização.', undo: true })
  }
  /** Só preenche o formulário de conferência; o orientador ainda precisa registrar a conferência. */
  function applyAtaSuggestion(grade: number | null, nominated: boolean | null) {
    if (!board) return
    const boardNominated = board.nominatedByBoard === undefined ? '' : board.nominatedByBoard ? 'sim' : 'nao'
    setAtaForm((current) => ({
      grade: grade === null ? current?.grade ?? board.grade?.toString().replace('.', ',') ?? '' : grade.toString().replace('.', ','),
      nominated: nominated === null ? current?.nominated ?? boardNominated : nominated ? 'sim' : 'nao',
    }))
    setFormError('')
  }
  function addSuggestedTasks(corrections: Array<{ title: string; detail: string }>, origin = 'leitura da ata') {
    if (!work || corrections.length === 0) return
    const stamp = Date.now().toString(36)
    const created: CorrectionTask[] = corrections.map((item, index) => ({ id: `task-ai-${stamp}-${index}-${Math.random().toString(36).slice(2, 6)}`, workId: work.id, title: item.title, detail: item.detail, source: 'sugestao-ia', status: 'aberta' }))
    setState((current) => ({ ...current, correctionTasks: [...current.correctionTasks, ...created] }))
    const count = created.length
    addHistory('Correções sugeridas pela IA', `${count} ${count === 1 ? 'tarefa criada' : 'tarefas criadas'} a partir da ${origin}; aguardam revisão do orientador.`)
    notify({ kind: 'success', message: count === 1 ? '1 correção adicionada como tarefa. Revise na etapa "Versão final".' : `${count} correções adicionadas como tarefas. Revise na etapa "Versão final".`, undo: true })
  }
  /** Falhas da revisão de conformidade viram tarefas de origem "sugestao-ia". */
  function addComplianceTasks(drafts: ComplianceTaskDraft[]) { addSuggestedTasks(drafts, 'revisão de conformidade') }
  /** Contexto enviado à revisão de conformidade: cadastro, correções da banca e nome de arquivo esperado. */
  function complianceContext(fileName: string | undefined, expectedFileName: string): ComplianceContext {
    return {
      title: work?.title ?? '', authors, courseCode: course?.code ?? '', year: board?.year, semester: board?.semester, expectedFileName, fileName,
      corrections: tasks.filter((task) => task.source === 'banca').map((task) => ({ title: task.title, detail: task.detail, status: task.status })),
      grade: board?.grade, nominated: board?.nominatedByBoard, accessLevel: term.accessLevel,
    }
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
    setAdjustingVersion(''); setAdjustmentNote(''); setFormError(''); setOpenStep(null)
    notify({ kind: 'success', message: status === 'aprovada' ? `Versão ${version.number} aprovada. O Termo de Autorização foi liberado.` : `Ajustes registrados para a versão ${version.number}.`, undo: true })
  }
  function updateTerm(changes: Partial<TermData>) {
    updateDocument(termDocument, { term: { ...term, ...changes } })
  }
  function approveTerm() {
    if (!board) return
    if (failingTermChecks.length) { notify({ kind: 'error', message: `Validação pendente: ${failingTermChecks.map((check) => check.label).join('; ')}.` }); return }
    updateDocument(termDocument, { status: 'aprovado', note: undefined, term })
    setState((current) => ({ ...current, boards: current.boards.map((item) => item.id === board.id ? { ...item, status: 'concluida' } : item) }))
    addHistory('Termo de Autorização validado', `Formato, nome, campos e assinaturas conferidos. Acesso: ${accessLabels[term.accessLevel]}. Banca concluída.`)
    setOpenStep(null)
    notify({ kind: 'success', message: 'TA validado e banca concluída. Falta encaminhar o pacote à biblioteca.', undo: true })
  }
  function forwardPackage() {
    if (!work || !board || !approvedVersion || !termDocument.file) return
    const now = new Date().toISOString()
    const packageFiles = [approvedVersion.file.name, termDocument.file.name]
    setState((current) => ({ ...current, deposits: [...current.deposits.filter((item) => item.workId !== work.id), { workId: work.id, status: 'encaminhado', forwardedBy: viewer.id, sentToLibraryAt: now, academicServicesCopy: true, packageFiles }] }))
    addHistory('Pacote encaminhado à biblioteca', `${packageFiles.join(' + ')}; cópia do TA à Diretoria de Serviços Acadêmicos (registro demonstrativo).`, now)
    notify({ kind: 'success', message: 'Pacote na fila da biblioteca (registro local, sem e-mail).', undo: true })
  }
  function updateTask(task: CorrectionTask, status: CorrectionTask['status']) {
    setState((current) => ({ ...current, correctionTasks: current.correctionTasks.map((item) => item.id === task.id ? { ...item, status, reviewedBy: status === 'revisada' ? viewer.id : item.reviewedBy } : item) }))
    notify({ kind: 'success', message: status === 'revisada' ? 'Sugestão marcada como revisada.' : 'Tarefa concluída.', undo: true })
  }
  function changeBoard(nextId: string) {
    setBoardId(nextId); setOpenStep(null); setAtaForm(null); setAdjustingDoc(''); setAdjustingVersion(''); setFormError('')
  }

  function documentControls(document: BoardDocument) {
    return <>
      {document.note && <div className="document-adjustment"><AlertCircle size={14} /><span>Ajuste solicitado: {document.note}</span></div>}
      {document.status !== 'aprovado' && <FilePicker label={document.file ? 'Substituir arquivo' : 'Selecionar arquivo'} file={document.file} onSelect={(file) => selectFile(document, file)} />}
      {document.status === 'aprovado' && document.file && <p className="document-approved-file"><CheckCircle2 size={15} /> {document.file.name}</p>}
      {document.file && document.status !== 'aprovado' && document.status !== 'ajustes-solicitados' && adjustingDoc !== document.id && <button className="text-button" onClick={() => { setAdjustingDoc(document.id); setFormError(''); setAdjustmentNote('') }}><MessageSquareText size={14} /> Solicitar ajuste</button>}
      {adjustingDoc === document.id && <form className="adjustment-form" onSubmit={(event) => askForDocumentAdjustments(event, document)}><label htmlFor={`doc-note-${document.id}`}>O que precisa mudar?</label><textarea id={`doc-note-${document.id}`} value={adjustmentNote} onChange={(event) => setAdjustmentNote(event.target.value)} rows={2} placeholder="Ex.: faltam assinaturas na página final" autoFocus />{formError && <span className="form-error" role="alert">{formError}</span>}<div><button className="button button--small" type="button" onClick={() => setAdjustingDoc('')}>Cancelar</button><button className="button button--small button--primary" type="submit">Registrar solicitação</button></div></form>}
    </>
  }

  const stepPanels: Record<Step, ReactNode> = board && work ? {
    ata: <StepPanel title="Ata de Defesa" description="Anexe a ata assinada e registre a nota e a indicação da banca. Esses dados vão para o Termo de Autorização." status={ataDocument.status}>
      {documentControls(ataDocument)}
      {ataDocument.file && !hasAta && <AtaAssistant key={board.id} context={{ title: work.title, authors, defenseDate: board.date }} onApplyGrade={applyAtaSuggestion} onAddTasks={addSuggestedTasks} />}
      {ataDocument.file && !hasAta && !ataForm && <div className="step-actions"><button className="button button--primary" onClick={() => { setAtaForm({ grade: board.grade?.toString().replace('.', ',') ?? '', nominated: board.nominatedByBoard === undefined ? '' : board.nominatedByBoard ? 'sim' : 'nao' }); setFormError('') }}><ShieldCheck size={15} /> Conferir ata</button></div>}
      {ataForm && <form className="inline-form" onSubmit={approveAta}>
        <div className="inline-form__fields"><label>Nota na ata<input inputMode="decimal" value={ataForm.grade} onChange={(event) => setAtaForm({ ...ataForm, grade: event.target.value })} placeholder="Ex.: 9,0" autoFocus /></label>
          <label>Indicação para texto integral<select value={ataForm.nominated} onChange={(event) => setAtaForm({ ...ataForm, nominated: event.target.value as 'sim' | 'nao' })}><option value="">Selecione</option><option value="sim">Sim, a banca indicou</option><option value="nao">Não indicou</option></select></label></div>
        <p className="hint">Nota ≥ 9 com indicação permite texto integral no RIC-CPS (Art. 14).</p>
        {formError && <span className="form-error" role="alert">{formError}</span>}
        <div className="inline-form__actions"><button className="button" type="button" onClick={() => setAtaForm(null)}>Cancelar</button><button className="button button--primary" type="submit">Registrar conferência</button></div>
      </form>}
    </StepPanel>,
    versao: <StepPanel title="Versão final" description={<>O aval vale só para a versão escolhida. Nome esperado: <code>{expectedWorkName}</code></>}>
      {versions.length === 0 ? <p className="step-empty">O aluno ainda não enviou a versão corrigida.</p> : <div className="review-list">{versions.map((version) => <article className={`review-version ${latest?.id === version.id ? 'review-version--latest' : ''}`} key={version.id}>
        <div className="version-badge">v{version.number}</div><div className="review-version__content"><div className="review-version__title"><strong>{version.file.name}</strong><StatusBadge status={version.status} /></div><span>{new Date(version.submittedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · {formatSize(version.file.size)}</span>
          <CheckChips checks={checkRicFile(version.file, expectedWorkName, MAX_WORK_BYTES)} />
          {version.reviewNote && version.status !== 'aprovada' && <p>{version.reviewNote}</p>}
          {version.status === 'enviada' && adjustingVersion !== version.id && <div className="review-actions"><button className="button button--small button--primary" onClick={() => reviewVersion(version, 'aprovada')}><CheckCircle2 size={14} /> Aprovar esta versão</button><button className="text-button" onClick={() => { setAdjustingVersion(version.id); setAdjustmentNote(''); setFormError('') }}><MessageSquareText size={14} /> Solicitar ajustes</button></div>}
          {version.status === 'enviada' && reviewableVersion?.id === version.id && <ComplianceReview key={version.id} kind="versao-final" context={complianceContext(version.file.name, expectedWorkName)} onCreateTasks={addComplianceTasks} />}
          {adjustingVersion === version.id && <form className="adjustment-form" onSubmit={(event) => { event.preventDefault(); reviewVersion(version, 'ajustes-solicitados', adjustmentNote) }}><label htmlFor={`version-note-${version.id}`}>Ajustes para a versão {version.number}</label><textarea id={`version-note-${version.id}`} value={adjustmentNote} onChange={(event) => setAdjustmentNote(event.target.value)} rows={2} placeholder="Descreva o que deve ser revisto" autoFocus />{formError && <span className="form-error" role="alert">{formError}</span>}<div><button className="button button--small" type="button" onClick={() => setAdjustingVersion('')}>Cancelar</button><button className="button button--small button--primary" type="submit">Registrar ajustes</button></div></form>}
        </div>
      </article>)}</div>}
      {tasks.length > 0 && <div className="task-block"><h3>Tarefas de correção <span>{tasks.filter((task) => task.status === 'aberta').length} em aberto</span></h3>
        <ul className="review-task-list">{tasks.map((task) => <li className="review-task" key={task.id}><span className={`review-task__source ${task.source === 'sugestao-ia' ? 'review-task__source--ai' : ''}`} title={task.source === 'sugestao-ia' ? 'Sugestão de IA, sujeita à revisão do orientador' : 'Indicada pela banca'}>{task.source === 'sugestao-ia' ? <Sparkles size={14} /> : <Check size={14} />}</span><div><div className="review-task__title"><strong>{task.title}</strong><StatusBadge status={task.status} /></div><p>{task.detail}</p></div>{task.source === 'sugestao-ia' && task.status === 'aberta' && <button className="button button--small" onClick={() => updateTask(task, 'revisada')}>Marcar revisada</button>}{task.status !== 'concluida' && task.source === 'banca' && <button className="button button--small" onClick={() => updateTask(task, 'concluida')}>Concluir</button>}</li>)}</ul>
        <p className="hint"><Sparkles size={13} /> Sugestões de IA vêm da leitura da ata e só valem após revisão do orientador.</p>
      </div>}
    </StepPanel>,
    termo: <StepPanel title="Termo de Autorização RIC-CPS" description={<>Anexo C, pré-preenchido com a ata e o cadastro. Nome esperado: <code>{expectedTermName}</code></>} status={termDocument.status}>
      {!termUnlocked ? <div className="locked-note"><Lock size={16} /><p>Ele é liberado depois da <strong>ata conferida</strong> e do <strong>aval de uma versão final</strong>, porque traz a nota, a indicação e a declaração de correções.</p></div> : <>
        <div className="term-grid">
          <dl className="term-prefill">
            <div><dt>Curso</dt><dd>{course?.name}</dd></div><div><dt>Tipo · produto</dt><dd>{work.workType} · {work.hasProduct ? 'com produto' : 'sem produto'}</dd></div>
            <div><dt>Orientador</dt><dd>{state.users.find((user) => user.id === work.advisorId)?.name}</dd></div>
            <div><dt>Defesa · nota</dt><dd>{formatDate(board.date)} · {board.grade?.toLocaleString('pt-BR')} ({board.nominatedByBoard ? 'indicado' : 'não indicado'})</dd></div>
          </dl>
          <div className="term-fields">
            <label>Acesso ao texto integral<select disabled={hasTerm} value={term.accessLevel} onChange={(event) => updateTerm({ accessLevel: event.target.value as TermData['accessLevel'] })}>{(Object.keys(accessLabels) as TermData['accessLevel'][]).map((level) => <option key={level} value={level} disabled={level === 'integral' && !integralAllowed(board.grade, board.nominatedByBoard)}>{accessLabels[level]}</option>)}</select>{!integralAllowed(board.grade, board.nominatedByBoard) && <small>Integral indisponível: exige nota ≥ 9 e indicação.</small>}</label>
            {term.accessLevel === 'embargo' && <label>Embargo até<input type="date" disabled={hasTerm} value={term.embargoUntil ?? ''} onChange={(event) => updateTerm({ embargoUntil: event.target.value || undefined })} /></label>}
            <label>Agência de fomento<select disabled={hasTerm} value={term.fundingAgency} onChange={(event) => updateTerm({ fundingAgency: event.target.value as TermData['fundingAgency'] })}>{(Object.keys(fundingLabels) as TermData['fundingAgency'][]).map((agency) => <option key={agency} value={agency}>{fundingLabels[agency]}</option>)}</select></label>
            <label className="term-check"><input type="checkbox" disabled={hasTerm} checked={term.correctionsDeclared} onChange={(event) => updateTerm({ correctionsDeclared: event.target.checked })} /> Autores declaram que as correções da banca foram realizadas</label>
            <fieldset className="term-signatures"><legend>Assinaturas no documento</legend>
              <label className="term-check"><input type="checkbox" disabled={hasTerm} checked={term.signatures.authors} onChange={(event) => updateTerm({ signatures: { ...term.signatures, authors: event.target.checked } })} /> Autores</label>
              <label className="term-check"><input type="checkbox" disabled={hasTerm} checked={term.signatures.advisor} onChange={(event) => updateTerm({ signatures: { ...term.signatures, advisor: event.target.checked } })} /> Orientador</label>
              <span className={`term-check term-check--readonly ${term.signatures.coordinator ? 'term-check--ok' : ''}`}>{term.signatures.coordinator ? <Check size={14} /> : <X size={14} />} Coordenador · {term.signatures.coordinator ? `confirmada por ${state.users.find((user) => user.id === term.coordinatorSignedBy)?.name}` : 'confirma no perfil Coordenação'}</span>
            </fieldset>
          </div>
        </div>
        <div className="term-file">
          <div className="term-file__links"><button className="button button--small" onClick={() => downloadTermDraft({ board, work, course: course?.name ?? '', authors, advisor: state.users.find((user) => user.id === work.advisorId)?.name ?? '', term, fileName: expectedTermName })}><Download size={14} /> Baixar TA pré-preenchido</button>{expectedTermName === SAMPLE_TERM && <a className="inline-link" href={`/amostras/${SAMPLE_TERM}`} download>Amostra válida</a>}<a className="inline-link" href="/amostras/termo-sem-pdfa.pdf" download>Amostra inválida</a></div>
          {documentControls(termDocument)}
        </div>
        <CheckList checks={termChecks} />
        <ComplianceReview key={board.id} kind="termo" context={complianceContext(termDocument.file?.name, expectedTermName)} sample={{ courseName: course?.name, advisor: state.users.find((user) => user.id === work.advisorId)?.name, defenseDate: board.date, workType: work.workType, hasProduct: work.hasProduct }} onCreateTasks={addComplianceTasks} />
        {!hasTerm && <div className="step-actions"><button className="button button--primary" onClick={approveTerm} disabled={failingTermChecks.length > 0}><ShieldCheck size={15} /> Validar TA e concluir banca</button>{failingTermChecks.length > 0 && <span className="hint">Falta: {failingTermChecks.map((check) => check.label.toLowerCase()).join('; ')}</span>}</div>}
        <p className="hint hint--muted">A checagem de PDF/A lê a declaração nos metadados XMP e não substitui um validador completo. Assinaturas não têm a autenticidade verificada.</p>
      </>}
    </StepPanel>,
    biblioteca: <StepPanel title="Encaminhamento à biblioteca" description="O orientador envia a versão final e o TA; o bibliotecário submete no RIC-CPS (Arts. 10 e 11)." status={deposit?.status ?? 'nao-encaminhado'}>
      {!hasTerm ? <div className="locked-note"><Lock size={16} /><p>Libera depois de validar o Termo de Autorização.</p></div>
        : forwarded ? <p className="document-approved-file"><CheckCircle2 size={15} /> {deposit!.packageFiles?.join(' + ')} · cópia do TA à Diretoria de Serviços Acadêmicos</p>
          : <div className="step-actions"><button className="button button--primary" onClick={forwardPackage}><Send size={15} /> Encaminhar pacote à biblioteca</button><span className="hint">Prazo: até {formatDate(libraryDate)}</span></div>}
    </StepPanel>,
  } : { ata: null, versao: null, termo: null, biblioteca: null }

  return <>
    <PageHeader title="Pós-banca" description="Da ata ao encaminhamento à biblioteca, uma etapa por vez." actions={boards.length > 0 && <label className="board-picker"><span>Banca</span><select value={boardId} onChange={(event) => changeBoard(event.target.value)}>{boards.map((item) => <option key={item.id} value={item.id}>{state.works.find((workItem) => workItem.id === item.workId)?.title}</option>)}</select></label>} />
    {board && work ? <div className="post-layout">
      <section className="post-work-strip">
        <div className="post-work-strip__main"><span>{course?.code} · {work.workType} · defesa em {formatDate(board.date)}</span><strong>{work.title}</strong><small>{authors.join(' e ')}</small></div>
        <div className="post-work-strip__side"><StatusBadge status={board.status} />
          <div className="deadline-pills">
            <span className={`deadline-pill ${!approvedVersion && correctionLeft < 0 ? 'deadline-pill--late' : ''}`}>Correção até {formatDate(correctionDate)}{!approvedVersion && ` · ${correctionLeft < 0 ? `${-correctionLeft} dia(s) de atraso` : `${correctionLeft} dia(s)`}`}</span>
            <span className="deadline-pill">Biblioteca até {formatDate(libraryDate)}</span>
          </div>
        </div>
      </section>
      <ol className="stepper" aria-label="Etapas do pós-banca">{steps.map((step, index) => <li key={step.id}>
        <button className={`stepper__step ${activeStep === step.id ? 'stepper__step--active' : ''} ${step.done ? 'stepper__step--done' : ''} ${step.locked ? 'stepper__step--locked' : ''}`} aria-current={activeStep === step.id ? 'step' : undefined} onClick={() => setOpenStep(step.id)}>
          <span className="stepper__marker">{step.done ? <Check size={14} /> : step.locked ? <Lock size={12} /> : index + 1}</span>
          <span className="stepper__text"><strong>{step.label}</strong><small>{step.summary}</small></span>
        </button>
      </li>)}</ol>
      {stepPanels[activeStep]}
    </div> : <div className="panel empty-page"><span className="empty-page__icon"><FileCheck2 size={22} /></span><h2>Nenhuma banca pós-defesa</h2><p>Registre a realização de uma banca na agenda para começar.</p></div>}
  </>
}

function StepPanel({ title, description, status, children }: { title: string; description: ReactNode; status?: string; children: ReactNode }) {
  return <section className="panel step-panel"><header className="step-panel__heading"><div><h2>{title}</h2><p>{description}</p></div>{status && <StatusBadge status={status} />}</header><div className="step-panel__body">{children}</div></section>
}

/** Mostra primeiro o que falta; os itens aprovados ficam recolhidos. */
export function CheckList({ checks }: { checks: CheckResult[] }) {
  const failing = checks.filter((check) => !check.ok)
  const passing = checks.filter((check) => check.ok)
  const item = (check: CheckResult) => <li key={check.id} className={check.ok ? 'check-list__ok' : 'check-list__fail'}><span>{check.ok ? <Check size={12} /> : <X size={12} />}</span><div><strong>{check.label}</strong><small>{check.detail}</small></div></li>
  return <div className="check-summary" aria-label="Validação automática">
    <p className={`check-summary__title ${failing.length ? '' : 'check-summary__title--ok'}`}>{failing.length ? `${passing.length} de ${checks.length} itens ok` : `Todos os ${checks.length} itens ok`}</p>
    {failing.length > 0 && <ul className="check-list">{failing.map(item)}</ul>}
    {passing.length > 0 && <details className="check-summary__passed"><summary>Ver itens aprovados ({passing.length})</summary><ul className="check-list">{passing.map(item)}</ul></details>}
  </div>
}

export function CheckChips({ checks }: { checks: CheckResult[] }) {
  return <div className="check-chips">{checks.map((check) => <span key={check.id} title={check.detail} className={check.ok ? 'check-chip check-chip--ok' : 'check-chip check-chip--fail'}>{check.ok ? <Check size={11} /> : <X size={11} />}{check.label}</span>)}</div>
}

function downloadTermDraft({ board, work, course, authors, advisor, term, fileName }: { board: DefenseBoard; work: Work; course: string; authors: string[]; advisor: string; term: TermData; fileName: string }) {
  const escape = (text: string) => text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!)
  const rows: Array<[string, string]> = [
    ['Curso', course], ['Título', work.title], ['Tipo do trabalho', work.workType], ['Produto complementar', work.hasProduct ? 'Sim' : 'Não'],
    ['Unidade', 'Fatec Bauru'], ['Município', 'Bauru'], ['Orientador', advisor], ['Autores', authors.join(', ')],
    ['Data da defesa', formatDate(board.date)], ['Nota', board.grade?.toLocaleString('pt-BR') ?? ''],
    ['Indicação da banca para disponibilização integral', board.nominatedByBoard ? 'Sim' : 'Não'],
    ['Acesso', accessLabels[term.accessLevel] + (term.accessLevel === 'embargo' && term.embargoUntil ? ` (até ${formatDate(term.embargoUntil)})` : '')],
    ['Agência de fomento', fundingLabels[term.fundingAgency]], ['Arquivo final esperado', fileName],
  ]
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Rascunho do Termo de Autorização</title><style>body{font:14px/1.5 sans-serif;max-width:720px;margin:40px auto;color:#1d2a30}table{border-collapse:collapse;width:100%}td{border:1px solid #ccd;padding:6px 8px;vertical-align:top}td:first-child{width:38%;font-weight:600}.warn{padding:10px;background:#fbf3e2;border:1px solid #e3cf9f}.sign{margin-top:36px;display:grid;gap:32px}.sign div{border-top:1px solid #333;padding-top:4px}</style>
<p class="warn">Rascunho gerado pelo Integrae (demonstração). Use o modelo oficial do Anexo C da Portaria CEETEPS-GDS nº 4069/2024 para coletar as assinaturas.</p>
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
