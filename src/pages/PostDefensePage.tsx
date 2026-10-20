import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle, ArrowRight, Check, CheckCircle2, FileCheck2, FileText, Lightbulb, MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react'
import { FilePicker } from '../components/FilePicker'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import type { BoardDocument, CorrectionTask, FinalVersion } from '../domain/types'
import type { PageProps } from '../App'
import './PostDefensePage.css'

export function PostDefensePage({ state, setState, viewer, notify }: PageProps) {
  const boards = useMemo(() => [...state.boards].filter((board) => board.status !== 'agendada').sort((a, b) => b.date.localeCompare(a.date)), [state.boards])
  const [boardId, setBoardId] = useState(() => boards.find((board) => board.status === 'pendente-correcao')?.id ?? boards[0]?.id ?? '')
  const [adjustingDoc, setAdjustingDoc] = useState('')
  const [adjustingVersion, setAdjustingVersion] = useState('')
  const [adjustmentNote, setAdjustmentNote] = useState('')
  const [formError, setFormError] = useState('')
  const board = state.boards.find((item) => item.id === boardId)
  const work = board && state.works.find((item) => item.id === board.workId)
  const documents = state.documents.filter((document) => document.boardId === boardId)
  const versions = work ? state.versions.filter((version) => version.workId === work.id).sort((a, b) => b.number - a.number) : []
  const tasks = work ? state.correctionTasks.filter((task) => task.workId === work.id) : []
  const latest = versions[0]
  const ataDocument = documents.find((document) => document.kind === 'ata')
  const authorizationDocument = documents.find((document) => document.kind === 'autorizacao-ric-cps')
  const hasAta = ataDocument?.status === 'aprovado'
  const hasAuthorization = authorizationDocument?.status === 'aprovado'
  const pendingTasks = tasks.filter((task) => task.status !== 'concluida')
  const checklist = [
    { label: hasAta ? `Ata conferida: ${ataDocument?.file?.name}` : ataDocument?.file ? `Conferir Ata: ${ataDocument.file.name}` : 'Anexar Ata de Defesa preenchida e assinada', done: hasAta },
    { label: hasAuthorization ? `Autorização conferida: ${authorizationDocument?.file?.name}` : authorizationDocument?.file ? `Conferir Autorização: ${authorizationDocument.file.name}` : 'Anexar Autorização RIC-CPS', done: hasAuthorization },
    { label: latest ? `Avaliar versão ${latest.number}: ${latest.file.name}` : 'Aguardar envio da versão definitiva pelo aluno', done: Boolean(latest && latest.status === 'aprovada') },
    { label: pendingTasks.length ? `Revisar ${pendingTasks.length} tarefa(s) de correção em aberto` : 'Tarefas de correção revisadas', done: pendingTasks.length === 0 },
  ]

  function updateDocument(documentId: string, changes: Partial<BoardDocument>, baseDocument?: BoardDocument) {
    setState((current) => ({ ...current, documents: current.documents.some((document) => document.id === documentId)
      ? current.documents.map((document) => document.id === documentId ? { ...document, ...changes } : document)
      : baseDocument ? [...current.documents, { ...baseDocument, ...changes }] : current.documents }))
  }
  function selectFile(document: BoardDocument, file: NonNullable<BoardDocument['file']>) {
    updateDocument(document.id, { file, status: 'enviado', note: undefined, requestedAt: undefined }, document)
    if (board) setState((current) => ({ ...current, history: [...current.history, { id: `h-${Date.now().toString(36)}`, boardId: board.id, at: file.selectedAt, actorId: viewer.id, label: document.kind === 'ata' ? 'Ata anexada' : 'Autorização anexada', detail: `${file.name} foi selecionado; os metadados foram guardados localmente.` }] }))
    notify({ kind: 'success', message: 'Metadados do documento registrados.' })
  }
  function askForDocumentAdjustments(event: FormEvent<HTMLFormElement>, document: BoardDocument) {
    event.preventDefault()
    if (!adjustmentNote.trim()) { setFormError('Descreva o ajuste solicitado.'); return }
    updateDocument(document.id, { status: 'ajustes-solicitados', note: adjustmentNote.trim(), requestedAt: new Date().toISOString() })
    setAdjustingDoc(''); setAdjustmentNote(''); setFormError('')
    notify({ kind: 'success', message: 'Solicitação de ajuste registrada no histórico do documento.' })
  }
  function approveDocument(document: BoardDocument) {
    if (!document.file) { notify({ kind: 'error', message: 'Anexe o documento antes de registrar a conferência.' }); return }
    if (!window.confirm(`Registrar a conferência demonstrativa de “${document.file.name}”?`)) return
    updateDocument(document.id, { status: 'aprovado', note: undefined })
    notify({ kind: 'success', message: 'Documento marcado como conferido nesta demonstração.' })
  }
  function reviewVersion(version: FinalVersion, status: 'aprovada' | 'ajustes-solicitados', note?: string) {
    if (!board || !work) return
    if (status === 'ajustes-solicitados' && !note?.trim()) { setFormError('Descreva os ajustes solicitados para esta versão.'); return }
    const now = new Date().toISOString()
    setState((current) => ({
      ...current,
      versions: current.versions.map((item) => item.id === version.id ? { ...item, status, reviewedAt: now, reviewedBy: viewer.id, reviewNote: note?.trim() || (status === 'aprovada' ? 'Aval do orientador registrado para esta versão.' : undefined) } : item),
      history: [...current.history, { id: `h-${Date.now().toString(36)}`, boardId: board.id, at: now, actorId: viewer.id, label: status === 'aprovada' ? `Versão ${version.number} aprovada` : `Ajustes solicitados na versão ${version.number}`, detail: status === 'aprovada' ? `Aval registrado somente para a versão ${version.number} (${version.file.name}).` : note!.trim() }],
    }))
    setAdjustingVersion(''); setAdjustmentNote(''); setFormError('')
    notify({ kind: 'success', message: status === 'aprovada' ? `Versão ${version.number} aprovada. O estado da banca e as versões futuras não mudaram.` : `Ajustes registrados para a versão ${version.number}.` })
  }
  function updateTask(task: CorrectionTask, status: CorrectionTask['status']) {
    setState((current) => ({ ...current, correctionTasks: current.correctionTasks.map((item) => item.id === task.id ? { ...item, status, reviewedBy: status === 'revisada' ? viewer.id : item.reviewedBy } : item) }))
    notify({ kind: 'success', message: status === 'revisada' ? 'Sugestão registrada como revisada pelo orientador.' : 'Tarefa de correção atualizada.' })
  }

  return <>
    <PageHeader title="Pós-banca e documentos" description="Confira arquivos, registre ajustes e avalie cada versão separadamente." actions={<label className="board-picker"><span>Banca</span><select value={boardId} onChange={(event) => setBoardId(event.target.value)}>{boards.map((item) => <option key={item.id} value={item.id}>{state.works.find((workItem) => workItem.id === item.workId)?.title}</option>)}</select></label>} />
    {board && work ? <>
      <section className="post-work-strip"><div><span>{state.courses.find((course) => course.id === work.courseId)?.code} · Defesa em {new Date(`${board.date}T12:00:00`).toLocaleDateString('pt-BR')}</span><strong>{work.title}</strong><small>{work.authorIds.map((id) => state.users.find((user) => user.id === id)?.name).filter(Boolean).join(' e ')}</small></div><StatusBadge status={board.status} /></section>
      <div className="post-grid">
        <div className="post-primary">
          <section className="panel documents-panel"><div className="panel-heading"><div><h2>Documentos da banca</h2><p>Status documental é independente do estado acadêmico.</p></div><FileCheck2 size={18} className="section-icon" /></div>
            <div className="document-list">{(['ata', 'autorizacao-ric-cps'] as const).map((kind) => {
              const document = documents.find((item) => item.kind === kind) ?? { id: `new-${boardId}-${kind}`, boardId, kind, status: 'pendente' as const }
              const title = kind === 'ata' ? 'Ata de Defesa' : 'Autorização RIC-CPS'
              return <article className="document-row" key={kind}>
                <div className="document-row__heading"><span className={`document-icon document-icon--${kind}`}><FileText size={17} /></span><div><strong>{title}</strong><span>{kind === 'ata' ? 'Preenchida e assinada' : 'Termo de autorização do trabalho'}</span></div><StatusBadge status={document.status} /></div>
                {document.note && <div className="document-adjustment"><AlertCircle size={14} /><span>Ajuste solicitado: {document.note}</span></div>}
                <FilePicker label={document.file ? 'Substituir arquivo' : 'Selecionar arquivo'} file={document.file} onSelect={(file) => selectFile(document, file)} />
                <div className="document-actions">{document.file && document.status !== 'aprovado' && <button className="button button--small button--primary" onClick={() => approveDocument(document)}><ShieldCheck size={14} /> Registrar conferência</button>}{document.status !== 'ajustes-solicitados' && <button className="text-button" onClick={() => { setAdjustingDoc(adjustingDoc === document.id ? '' : document.id); setFormError(''); setAdjustmentNote('') }}><MessageSquareText size={14} /> Solicitar ajuste</button>}</div>
                {adjustingDoc === document.id && <form className="adjustment-form" onSubmit={(event) => askForDocumentAdjustments(event, document)}><label htmlFor={`doc-note-${document.id}`}>Descreva o que falta</label><textarea id={`doc-note-${document.id}`} value={adjustmentNote} onChange={(event) => setAdjustmentNote(event.target.value)} rows={2} placeholder="Ex.: faltam assinaturas na página final" />{formError && <span className="form-error" role="alert">{formError}</span>}<div><button className="button button--small" type="button" onClick={() => setAdjustingDoc('')}>Cancelar</button><button className="button button--small button--primary" type="submit">Registrar solicitação</button></div></form>}
              </article>
            })}</div>
            <p className="document-footnote"><AlertCircle size={14} /> Conferência de formato PDF/A, tamanho, assinaturas e autenticidade não é executada pelo protótipo.</p>
          </section>
          <section className="panel final-review-panel"><div className="panel-heading"><div><h2>Versões definitivas</h2><p>O aval é registrado para uma versão específica.</p></div><span className="flow-caption">{versions.length} versão(ões)</span></div>
            {versions.length === 0 ? <div className="empty-state"><span><FileText size={18} /></span><div><strong>O aluno ainda não enviou versão</strong><p>A versão aparecerá aqui após o envio pelo perfil de aluno.</p></div></div> : <div className="review-list">{versions.map((version) => <article className={`review-version ${latest?.id === version.id ? 'review-version--latest' : ''}`} key={version.id}>
              <div className="version-badge">v{version.number}</div><div className="review-version__content"><div className="review-version__title"><strong>{version.file.name}</strong><StatusBadge status={version.status} />{latest?.id === version.id && <span className="latest-tag">Mais recente</span>}</div><span>{new Date(version.submittedAt).toLocaleString('pt-BR')} · {formatSize(version.file.size)}</span>{version.reviewNote && <p>{version.reviewNote}</p>}{version.reviewedBy && <small>Revisada por {state.users.find((user) => user.id === version.reviewedBy)?.name}</small>}
                {version.status === 'enviada' && <div className="review-actions"><button className="button button--small button--primary" onClick={() => { if (window.confirm(`Registrar aval do orientador para a versão ${version.number}?`)) reviewVersion(version, 'aprovada') }}><CheckCircle2 size={14} /> Aprovar esta versão</button><button className="text-button" onClick={() => { setAdjustingVersion(adjustingVersion === version.id ? '' : version.id); setAdjustmentNote(''); setFormError('') }}><MessageSquareText size={14} /> Solicitar ajustes</button></div>}
                {adjustingVersion === version.id && <form className="adjustment-form" onSubmit={(event) => { event.preventDefault(); reviewVersion(version, 'ajustes-solicitados', adjustmentNote) }}><label htmlFor={`version-note-${version.id}`}>Ajustes para a versão {version.number}</label><textarea id={`version-note-${version.id}`} value={adjustmentNote} onChange={(event) => setAdjustmentNote(event.target.value)} rows={2} placeholder="Descreva o que deve ser revisto" />{formError && <span className="form-error" role="alert">{formError}</span>}<div><button className="button button--small" type="button" onClick={() => setAdjustingVersion('')}>Cancelar</button><button className="button button--small button--primary" type="submit">Registrar ajustes</button></div></form>}
              </div>
            </article>)}</div>}
          </section>
          <section className="panel corrections-review-panel"><div className="panel-heading"><div><h2>Tarefas de correção</h2><p>Sugestões automáticas ficam pendentes de revisão humana.</p></div><Sparkles size={18} className="section-icon" /></div>
            <div className="review-task-list">{tasks.length ? tasks.map((task) => <article className="review-task" key={task.id}><span className={`review-task__source ${task.source === 'sugestao-ia' ? 'review-task__source--ai' : ''}`}>{task.source === 'sugestao-ia' ? <Sparkles size={15} /> : <CheckCircle2 size={15} />}</span><div><div className="review-task__title"><strong>{task.title}</strong><StatusBadge status={task.status} /></div><p>{task.detail}</p><small>{task.source === 'sugestao-ia' ? 'Sugestão simulada · requer revisão do orientador' : 'Correção indicada pela banca'}</small></div>{task.source === 'sugestao-ia' && task.status === 'aberta' && <button className="button button--small" onClick={() => updateTask(task, 'revisada')}>Revisar sugestão</button>}{task.status !== 'concluida' && task.source === 'banca' && <button className="icon-button icon-button--small" aria-label={`Marcar ${task.title} como concluída`} onClick={() => updateTask(task, 'concluida')}><Check size={15} /></button>}</article>) : <div className="empty-state"><span><CheckCircle2 size={18} /></span><div><strong>Sem tarefas cadastradas</strong><p>As tarefas de correção ficarão ligadas ao trabalho selecionado.</p></div></div>}</div>
            <div className="ai-disclaimer"><Lightbulb size={15} /> Assistência de IA demonstrativa. Nenhum modelo externo foi chamado; o orientador decide o que vale.</div>
          </section>
        </div>
        <aside className="panel checklist-panel"><div className="checklist-heading"><span><CheckCircle2 size={17} /></span><div><h2>O que falta para encerrar</h2><p>Checklist da demonstração · não bloqueia ações</p></div></div><div className="checklist-items">{checklist.map((item) => <div className={`checklist-item ${item.done ? 'checklist-item--done' : ''}`} key={item.label}><span>{item.done ? <Check size={13} /> : <span className="checklist-empty" />}</span><p>{item.label}</p></div>)}</div><div className="checklist-count"><strong>{checklist.filter((item) => !item.done).length}</strong><span>pendência(s) nesta trilha</span></div><div className="checklist-info"><AlertCircle size={14} /><span>A aprovação de uma versão não aprova versões posteriores e não registra depósito.</span></div><button className="text-button checklist-history" onClick={() => notify({ kind: 'info', message: `${state.history.filter((event) => event.boardId === board.id).length} evento(s) registrados para esta banca.` })}>Ver resumo do histórico <ArrowRight size={14} /></button></aside>
      </div>
    </> : <div className="panel empty-page"><span className="empty-page__icon"><FileCheck2 size={22} /></span><h2>Nenhuma banca pós-defesa</h2><p>Cadastre ou realize uma banca antes de abrir a conferência documental.</p></div>}
  </>
}

function formatSize(size: number) { return size >= 1_048_576 ? `${(size / 1_048_576).toFixed(2)} MB` : `${(size / 1024).toFixed(1)} KB` }
