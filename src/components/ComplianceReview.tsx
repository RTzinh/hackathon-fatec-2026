import { useId, useRef, useState } from 'react'
import { Check, ClipboardCheck, LoaderCircle, Sparkles } from 'lucide-react'
import { buildSampleComplianceText } from '../domain/compliance-sample'
import type { ComplianceSampleExtras } from '../domain/compliance-sample'
import type { ComplianceConfidence, ComplianceContext, ComplianceItem, ComplianceKind, ComplianceReview as ComplianceResult, ComplianceStatus } from '../../server/compliance-review'
import './ComplianceReview.css'

/** Mesmo limite do servidor (server/compliance-review.ts); repetido aqui para não levar o módulo do servidor ao navegador. */
const MAX_CHARS = 15_000
const CLIENT_TIMEOUT_MS = 30_000
const confidenceLabels: Record<ComplianceConfidence, string> = { alta: 'alta', media: 'média', baixa: 'baixa' }
const statusLabels: Record<ComplianceStatus, string> = { ok: 'Ok', atencao: 'Atenção', falha: 'Falha', 'nao-verificavel': 'Não verificável' }
const statusOrder: Record<ComplianceStatus, number> = { falha: 0, atencao: 1, 'nao-verificavel': 2, ok: 3 }
const documentLabels: Record<ComplianceKind, string> = { 'versao-final': 'versão final', termo: 'Termo de Autorização' }

type Phase = 'idle' | 'loading' | 'done'

export interface ComplianceTaskDraft {
  title: string
  detail: string
}

interface ComplianceReviewProps {
  kind: ComplianceKind
  context: ComplianceContext
  /** Dados extras do cadastro, usados só no texto de exemplo. */
  sample?: ComplianceSampleExtras
  /** Cria tarefas de correção a partir das falhas; quem chama decide como registrá-las. */
  onCreateTasks?: (tasks: ComplianceTaskDraft[]) => void
}

function isStatus(value: unknown): value is ComplianceStatus {
  return value === 'ok' || value === 'atencao' || value === 'falha' || value === 'nao-verificavel'
}

function isReview(value: unknown): value is ComplianceResult {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Record<string, unknown>
  return Array.isArray(data.items) && data.items.every((item) => typeof item === 'object' && item !== null && isStatus((item as Record<string, unknown>).status) && typeof (item as Record<string, unknown>).id === 'string')
    && typeof data.summary === 'string' && typeof data.confidence === 'string'
}

async function requestReview(kind: ComplianceKind, text: string, context: ComplianceContext, signal: AbortSignal): Promise<ComplianceResult> {
  let response: Response
  try {
    response = await fetch('/api/compliance-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, text, context }), signal })
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) throw new Error('A IA demorou demais para responder. Tente novamente.')
    throw new Error('Não foi possível falar com o servidor de IA. Verifique a conexão e tente novamente.')
  }
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && typeof (data as { error?: unknown }).error === 'string' ? (data as { error: string }).error : ''
    throw new Error(message || (response.status === 404 ? 'O serviço de IA não está disponível neste ambiente.' : 'A IA não conseguiu revisar o documento agora. Tente novamente.'))
  }
  if (!isReview(data)) throw new Error('A IA devolveu uma resposta que não pôde ser lida. Tente novamente.')
  return data
}

function toTask(item: ComplianceItem): ComplianceTaskDraft {
  const title = item.rule.length > 90 ? `${item.rule.slice(0, 87).trimEnd()}…` : item.rule
  return { title, detail: [item.evidence, item.suggestion].filter(Boolean).join(' ') }
}

export function ComplianceReview({ kind, context, sample, onCreateTasks }: ComplianceReviewProps) {
  const textId = useId()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<ComplianceResult | null>(null)
  const [tasksCreated, setTasksCreated] = useState(0)
  const latestRequest = useRef(0)

  const length = text.length
  const tooLong = length > MAX_CHARS
  const loading = phase === 'loading'
  const label = documentLabels[kind]

  async function review() {
    if (!text.trim() || tooLong || loading) return
    const requestId = ++latestRequest.current
    setPhase('loading'); setError(''); setResult(null); setTasksCreated(0)
    try {
      const outcome = await requestReview(kind, text, context, AbortSignal.timeout(CLIENT_TIMEOUT_MS))
      if (requestId !== latestRequest.current) return
      setResult(outcome); setPhase('done')
    } catch (failure) {
      if (requestId !== latestRequest.current) return
      setError(failure instanceof Error ? failure.message : 'A IA não conseguiu revisar o documento agora. Tente novamente.')
      setPhase('idle')
    }
  }

  function close() {
    latestRequest.current++
    setOpen(false); setPhase((current) => current === 'loading' ? 'idle' : current)
  }

  const failures = result?.items.filter((item) => item.status === 'falha') ?? []
  function createTasks() {
    if (!onCreateTasks || failures.length === 0) return
    onCreateTasks(failures.map(toTask))
    setTasksCreated(failures.length)
  }

  if (!open) {
    return <div className="compliance-ai"><button className="button button--small compliance-ai__toggle" type="button" onClick={() => setOpen(true)}><ClipboardCheck size={14} /> Revisar conformidade com IA</button></div>
  }

  const counts = result ? (Object.keys(statusLabels) as ComplianceStatus[]).map((status) => ({ status, total: result.items.filter((item) => item.status === status).length })).filter((entry) => entry.total > 0) : []
  const sorted = result ? [...result.items].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]) : []
  return <section className="compliance-ai compliance-ai__panel" aria-label="Revisão de conformidade com IA">
    <div className="compliance-ai__intro">
      <strong>Revisar conformidade com IA</strong>
      <p className="hint">Cole o texto da {label}. A IA confere cada item com as normas e aponta o que encontrou; ela não aprova o documento.</p>
    </div>
    <div className="compliance-ai__field">
      <label htmlFor={textId}>Texto do documento</label>
      <textarea id={textId} value={text} onChange={(event) => setText(event.target.value)} rows={7} placeholder={`Cole aqui o texto da ${label}`} aria-invalid={tooLong || undefined} disabled={loading} />
      <div className="compliance-ai__meta">
        <button className="text-button" type="button" onClick={() => { setText(buildSampleComplianceText(kind, context, sample)); setError('') }} disabled={loading}>Usar texto de exemplo</button>
        <span className={`compliance-ai__count ${tooLong ? 'compliance-ai__count--over' : ''}`}>{length.toLocaleString('pt-BR')} / {MAX_CHARS.toLocaleString('pt-BR')} caracteres</span>
      </div>
    </div>
    {tooLong && <p className="form-error" role="alert">O texto passa de {MAX_CHARS.toLocaleString('pt-BR')} caracteres. Cole só as partes que quer revisar.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="compliance-ai__actions">
      <button className="button button--small" type="button" onClick={close}>Cancelar</button>
      <button className="button button--small button--primary" type="button" onClick={review} disabled={loading || !text.trim() || tooLong} aria-busy={loading}>
        {loading ? <><LoaderCircle size={14} className="compliance-ai__spinner" aria-hidden="true" /> Revisando…</> : <><Sparkles size={14} /> Revisar</>}
      </button>
    </div>
    <div aria-live="polite">
      {result && <div className="compliance-ai__result">
        <div className="compliance-ai__result-head">
          <span className="compliance-ai__badge"><Sparkles size={13} /> Revisão de IA · não substitui o aval do orientador</span>
          <span className={`status compliance-ai__confidence compliance-ai__confidence--${result.confidence}`}>Confiança {confidenceLabels[result.confidence] ?? result.confidence}</span>
        </div>
        <p className="compliance-ai__summary">{result.summary}</p>
        <ul className="compliance-ai__counts" aria-label="Resumo por situação">{counts.map((entry) => <li key={entry.status} className={`compliance-ai__status compliance-ai__status--${entry.status}`}>{entry.total} {statusLabels[entry.status]}</li>)}</ul>
        <ul className="compliance-ai__items">{sorted.map((item) => <li className="compliance-ai__item" key={item.id}>
          <div className="compliance-ai__item-head">
            <span className={`compliance-ai__status compliance-ai__status--${item.status}`}>{statusLabels[item.status]}</span>
            <strong>{item.rule}</strong>
          </div>
          <p className="compliance-ai__evidence">{item.evidence}</p>
          {item.suggestion && <p className="compliance-ai__suggestion"><span>Sugestão</span> {item.suggestion}</p>}
          <small className="compliance-ai__source">Fonte: {item.source}</small>
        </li>)}</ul>
        {onCreateTasks && failures.length > 0 && <div className="compliance-ai__actions compliance-ai__actions--start">
          {tasksCreated > 0
            ? <span className="hint compliance-ai__done"><Check size={13} /> {tasksCreated} {tasksCreated === 1 ? 'tarefa criada' : 'tarefas criadas'}</span>
            : <button className="button button--small" type="button" onClick={createTasks}>Criar tarefas para as falhas</button>}
        </div>}
      </div>}
    </div>
  </section>
}
