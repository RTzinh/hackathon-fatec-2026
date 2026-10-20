import { useState } from 'react'
import { AlertCircle, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, FileClock, FileText, History, Upload } from 'lucide-react'
import { FilePicker } from '../components/FilePicker'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { correctionDeadline } from '../domain/rules'
import type { StoredFile } from '../domain/types'
import type { PageProps } from '../App'
import './StudentPage.css'

export function StudentPage({ state, setState, viewer, notify }: PageProps) {
  const [selectedFile, setSelectedFile] = useState<StoredFile>()
  const [formError, setFormError] = useState('')
  const work = state.works.find((item) => item.authorIds.includes(viewer.id))
  const board = work && state.boards.find((item) => item.workId === work.id)
  const course = work && state.courses.find((item) => item.id === work.courseId)
  const advisor = work && state.users.find((item) => item.id === work.advisorId)
  const versions = work ? state.versions.filter((version) => version.workId === work.id).sort((a, b) => b.number - a.number) : []
  const tasks = work ? state.correctionTasks.filter((task) => task.workId === work.id) : []
  const deadline = board && (board.status === 'realizada' || board.status === 'pendente-correcao') ? correctionDeadline(board.date) : undefined
  const daysLeft = deadline ? daysFromToday(deadline) : undefined

  function submitVersion() {
    if (!work || !board || !selectedFile) { setFormError('Selecione um arquivo antes de enviar.'); return }
    if (!window.confirm('Registrar esta versão definitiva no histórico demonstrativo?')) return
    const now = new Date().toISOString()
    const nextNumber = Math.max(0, ...state.versions.filter((version) => version.workId === work.id).map((version) => version.number)) + 1
    const versionId = `v-${work.id}-${nextNumber}-${Date.now().toString(36)}`
    setState((current) => ({
      ...current,
      versions: [...current.versions, { id: versionId, workId: work.id, number: nextNumber, file: selectedFile, status: 'enviada', submittedAt: now }],
      history: [...current.history, { id: `h-${Date.now().toString(36)}`, boardId: board.id, at: now, actorId: viewer.id, label: `Versão ${nextNumber} enviada`, detail: `${selectedFile.name} foi registrado no histórico local.` }],
    }))
    setSelectedFile(undefined)
    setFormError('')
    notify({ kind: 'success', message: `Versão ${nextNumber} registrada. Aguarda análise do orientador.` })
  }

  if (!work || !board) return <><PageHeader title="Meu trabalho" description="Acompanhe banca, prazo e versões corrigidas." /><section className="panel empty-state student-empty"><span><FileText size={19} /></span><div><strong>Nenhum trabalho ligado a este perfil</strong><p>Troque o perfil de demonstração para ver outro cenário.</p></div></section></>

  return <>
    <PageHeader title="Meu trabalho" description="Correções, prazo e versão final acompanhados no mesmo lugar." />
    <section className="student-work-banner"><div className="student-work-banner__mark"><FileText size={20} /></div><div className="student-work-banner__copy"><span>{course?.code} · {work.workType}</span><h2>{work.title}</h2><p>Orientador(a): {advisor?.name} · {work.authorIds.map((id) => state.users.find((user) => user.id === id)?.name).filter(Boolean).join(' e ')}</p></div><StatusBadge status={board.status} /></section>
    <div className="student-grid">
      <div className="student-primary">
        <section className={`deadline-panel ${daysLeft !== undefined && daysLeft < 0 ? 'deadline-panel--late' : ''}`}>
          <div className="deadline-panel__main"><span className="deadline-icon"><Clock3 size={20} /></span><div><span className="small-label">PRAZO DEMONSTRATIVO · 15 DIAS CORRIDOS</span><strong>{deadline ? formatDate(deadline) : 'Aguardando realização da defesa'}</strong><span>{deadline && (daysLeft! < 0 ? `Atraso de ${Math.abs(daysLeft!)} dia(s)` : daysLeft === 0 ? 'Prazo termina hoje' : `${daysLeft} dia(s) restante(s)`)}</span></div></div>
          <div className="deadline-panel__rule"><AlertCircle size={15} /> Prazo calculado pela data da defesa + 15 dias corridos, conforme regra desta demonstração. Atraso gera aviso; não há bloqueio automático.</div>
        </section>
        <section className="panel correction-panel"><div className="panel-heading"><div><h2>Tarefas de correção</h2><p>Solicitações da banca e sugestões para revisar</p></div><span className="flow-caption">{tasks.filter((task) => task.status !== 'concluida').length} em aberto</span></div>
          {tasks.length ? <div className="task-list">{tasks.map((task) => <div className="correction-task" key={task.id}><span className={`task-check task-check--${task.status}`}>{task.status === 'concluida' ? <CheckCircle2 size={16} /> : <FileClock size={16} />}</span><div><div className="task-title-line"><strong>{task.title}</strong><StatusBadge status={task.status} /></div><p>{task.detail}</p><small>{task.source === 'sugestao-ia' ? 'Sugestão demonstrativa de IA · aguardando revisão do orientador' : 'Indicação da banca'}</small></div></div>)}</div> : <div className="empty-state"><span><CheckCircle2 size={18} /></span><div><strong>Nenhuma tarefa registrada</strong><p>As solicitações aparecerão aqui quando forem incluídas.</p></div></div>}
        </section>
        <section className="panel version-panel"><div className="panel-heading"><div><h2>Versões definitivas</h2><p>Cada análise e aprovação fica ligada à versão enviada.</p></div><History size={18} className="version-heading-icon" /></div>
          <div className="version-list">{versions.length ? versions.map((version) => <article className="version-row" key={version.id}><div className="version-badge">v{version.number}</div><div className="version-info"><strong>{version.file.name}</strong><span>{new Date(version.submittedAt).toLocaleString('pt-BR')} · {formatSize(version.file.size)}</span>{version.reviewNote && <p>{version.reviewNote}</p>}</div><StatusBadge status={version.status} /></article>) : <div className="empty-state"><span><FileText size={18} /></span><div><strong>Primeira versão ainda não enviada</strong><p>Selecione o arquivo da versão definitiva abaixo.</p></div></div>}</div>
        </section>
      </div>
      <aside className="student-upload-side"><section className="panel upload-panel"><div className="upload-panel-heading"><span><Upload size={17} /></span><div><h2>Enviar versão corrigida</h2><p>O orientador revisará o arquivo e registrará o aval.</p></div></div>
          <FilePicker label="Selecionar arquivo" file={selectedFile} onSelect={setSelectedFile} />
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <button className="button button--primary upload-submit" onClick={submitVersion} disabled={!selectedFile}><ArrowUpRight size={16} /> Registrar versão definitiva</button>
          <p className="upload-privacy">Arquivo e validação PDF/A não são enviados nem verificados nesta versão do protótipo.</p>
        </section>
        <section className="panel student-next-panel"><h2>Próxima etapa</h2><div className="next-step"><span><CalendarDays size={16} /></span><div><strong>Aval do orientador</strong><p>A versão enviada aparecerá na fila de revisão.</p></div></div><div className="next-step"><span><CheckCircle2 size={16} /></span><div><strong>Registro no histórico</strong><p>Versões anteriores mantêm seu estado próprio.</p></div></div></section>
      </aside>
    </div>
  </>
}

function daysFromToday(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const today = new Date()
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.ceil((Date.UTC(year, month - 1, day) - todayUTC) / 86_400_000)
}
function formatDate(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) }
function formatSize(size: number) { return size >= 1_048_576 ? `${(size / 1_048_576).toFixed(2)} MB` : `${(size / 1024).toFixed(1)} KB` }
