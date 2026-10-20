import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, CheckCircle2, Clock3, Copy, Download, FileClock, FileText } from 'lucide-react'
import { FilePicker } from '../components/FilePicker'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { MAX_WORK_BYTES, checkRicFile, correctionDeadline, ricFileName } from '../domain/rules'
import { CheckChips } from './PostDefensePage'
import type { StoredFile } from '../domain/types'
import type { PageProps } from '../App'
import './StudentPage.css'

export function StudentPage({ state, setState, viewer, notify }: PageProps) {
  const [selectedFile, setSelectedFile] = useState<StoredFile>()
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<number | undefined>(undefined)
  const work = state.works.find((item) => item.authorIds.includes(viewer.id))
  const board = work && state.boards.find((item) => item.workId === work.id)
  const course = work && state.courses.find((item) => item.id === work.courseId)
  const advisor = work && state.users.find((item) => item.id === work.advisorId)
  const versions = work ? state.versions.filter((version) => version.workId === work.id).sort((a, b) => b.number - a.number) : []
  const tasks = work ? state.correctionTasks.filter((task) => task.workId === work.id).sort((a, b) => Number(a.status === 'concluida') - Number(b.status === 'concluida')) : []
  const openTasks = tasks.filter((task) => task.status !== 'concluida').length
  const deadline = board && (board.status === 'realizada' || board.status === 'pendente-correcao') ? correctionDeadline(board.date) : undefined
  const daysLeft = deadline ? daysFromToday(deadline) : undefined
  const expectedName = work && board && course ? ricFileName({ courseCode: course.code, year: board.year, semester: board.semester, firstAuthor: state.users.find((user) => user.id === work.authorIds[0])?.name ?? '', title: work.title }) : ''

  useEffect(() => () => window.clearTimeout(copiedTimer.current), [])

  async function copyName() {
    try {
      await navigator.clipboard.writeText(expectedName)
      setCopied(true)
      window.clearTimeout(copiedTimer.current)
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2200)
      notify({ kind: 'success', message: 'Nome do arquivo copiado.' })
    } catch {
      notify({ kind: 'error', message: 'Não foi possível copiar. Selecione o nome e copie manualmente.' })
    }
  }

  function submitVersion() {
    if (!work || !board || !selectedFile) return
    const now = new Date().toISOString()
    const nextNumber = Math.max(0, ...state.versions.filter((version) => version.workId === work.id).map((version) => version.number)) + 1
    const versionId = `v-${work.id}-${nextNumber}-${Date.now().toString(36)}`
    setState((current) => ({
      ...current,
      versions: [...current.versions, { id: versionId, workId: work.id, number: nextNumber, file: selectedFile, status: 'enviada', submittedAt: now }],
      history: [...current.history, { id: `h-${Date.now().toString(36)}`, boardId: board.id, at: now, actorId: viewer.id, label: `Versão ${nextNumber} enviada`, detail: `${selectedFile.name} foi registrado no histórico local.` }],
    }))
    setSelectedFile(undefined)
    notify({ kind: 'success', message: `Versão ${nextNumber} registrada. Aguarda análise do orientador.`, undo: true })
  }

  if (!work || !board) return <><PageHeader title="Meu trabalho" description="Prazo, correções e envio da versão final." /><section className="panel empty-state student-empty"><span><FileText size={19} /></span><div><strong>Nenhum trabalho ligado a este perfil</strong><p>Troque o perfil de demonstração para ver outro cenário.</p></div></section></>

  const late = daysLeft !== undefined && daysLeft < 0
  const coAuthors = work.authorIds.filter((id) => id !== viewer.id).map((id) => state.users.find((user) => user.id === id)?.name).filter(Boolean)

  return <>
    <PageHeader title="Meu trabalho" description="Prazo, correções e envio da versão final." />

    <section className="work-summary" aria-label="Seu trabalho">
      <div className="work-summary__copy">
        <span>{course?.code} · {work.workType}</span>
        <h2>{work.title}</h2>
        <p>Orientador(a): {advisor?.name}{coAuthors.length > 0 && ` · Com ${coAuthors.join(' e ')}`}</p>
      </div>
      <StatusBadge status={board.status} />
    </section>

    <section className={`deadline-panel ${late ? 'deadline-panel--late' : ''}`} aria-label="Prazo">
      <span className="deadline-icon"><Clock3 size={20} /></span>
      <div className="deadline-panel__text">
        <span className="deadline-panel__label">Prazo da versão corrigida</span>
        <strong>{deadline ? formatDate(deadline) : 'Começa depois da defesa'}</strong>
        <p>{deadline ? 'Data da defesa + 15 dias corridos. O atraso gera aviso, sem bloqueio.' : `Defesa marcada para ${formatDate(board.date)}. O prazo conta 15 dias corridos a partir dela.`}</p>
      </div>
      {deadline && daysLeft !== undefined && <div className="deadline-panel__count">
        {daysLeft === 0 ? <strong>Hoje</strong> : <strong>{Math.abs(daysLeft)}</strong>}
        <span>{late ? 'dia(s) de atraso' : daysLeft === 0 ? 'último dia' : 'dia(s) restante(s)'}</span>
      </div>}
    </section>

    <section className="panel upload-panel" aria-labelledby="upload-title">
      <div className="panel-heading"><div><h2 id="upload-title">Enviar versão corrigida</h2><p>O orientador revisa o arquivo e registra o aval.</p></div></div>
      <div className="upload-body">
        <div className="upload-name">
          <span className="upload-name__label">Nome exigido pela Portaria 4069/2024</span>
          <code className="upload-name__code">{expectedName}</code>
          <div className="upload-name__actions">
            <button type="button" className="button button--small" onClick={copyName}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar nome'}</button>
            <a className="inline-link" href="/amostras/dsm_2026_2_davirocha_paineldeindicadoresparacooperativas.pdf" download><Download size={14} /> Baixar PDF de amostra para testar</a>
          </div>
          <p>PDF/A, até 10 GB. Produto complementar vai em .zip com o mesmo padrão.</p>
        </div>
        <div className="upload-file">
          <FilePicker label="Selecionar arquivo" file={selectedFile} onSelect={setSelectedFile} />
          {selectedFile && <CheckChips checks={checkRicFile(selectedFile, expectedName, MAX_WORK_BYTES)} />}
          <p className="upload-note">A checagem roda no navegador e não bloqueia o envio.</p>
          <button className="button button--primary upload-submit" onClick={submitVersion} disabled={!selectedFile}><ArrowUpRight size={16} /> Registrar versão definitiva</button>
        </div>
      </div>
    </section>

    <div className="student-lower">
      <section className="panel" aria-labelledby="tasks-title">
        <div className="panel-heading"><div><h2 id="tasks-title">Tarefas de correção</h2><p>{tasks.length ? (openTasks ? `${openTasks} em aberto de ${tasks.length}` : 'Todas concluídas') : 'Nada por enquanto'}</p></div></div>
        {tasks.length ? <ul className="task-list">{tasks.map((task) => <li className="correction-task" key={task.id}>
          <span className={`task-check task-check--${task.status}`}>{task.status === 'concluida' ? <CheckCircle2 size={16} /> : <FileClock size={16} />}</span>
          <div>
            <div className="task-title-line"><strong>{task.title}</strong><StatusBadge status={task.status} /></div>
            <p>{task.detail}</p>
            <small>{task.source === 'sugestao-ia' ? 'Sugestão de IA · aguarda revisão do orientador' : 'Indicação da banca'}</small>
          </div>
        </li>)}</ul> : <div className="empty-state"><span><CheckCircle2 size={18} /></span><div><strong>Nenhuma tarefa registrada</strong><p>Elas aparecem aqui quando a banca indicar correções.</p></div></div>}
      </section>

      <section className="panel" aria-labelledby="versions-title">
        <div className="panel-heading"><div><h2 id="versions-title">Versões definitivas</h2><p>{versions.length ? `${versions.length} enviada(s), da mais recente à mais antiga` : 'Nenhuma enviada'}</p></div></div>
        {versions.length ? <ul className="version-list">{versions.map((version) => <li className="version-row" key={version.id}>
          <div className="version-badge">v{version.number}</div>
          <div className="version-info">
            <strong>{version.file.name}</strong>
            <span>{new Date(version.submittedAt).toLocaleString('pt-BR')} · {formatSize(version.file.size)}</span>
            <CheckChips checks={checkRicFile(version.file, expectedName, MAX_WORK_BYTES)} />
            {version.reviewNote && <p>{version.reviewNote}</p>}
          </div>
          <StatusBadge status={version.status} />
        </li>)}</ul> : <div className="empty-state"><span><FileText size={18} /></span><div><strong>Primeira versão ainda não enviada</strong><p>Use o envio acima.</p></div></div>}
      </section>
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
