import { useId, useRef, useState } from 'react'
import { Check, LoaderCircle, Sparkles, TriangleAlert } from 'lucide-react'
import { buildSampleAta } from '../domain/ata-sample'
import type { AtaAnalysis, AtaConfidence, AtaContext, AtaCorrection } from '../../server/ata-assistant'
import './AtaAssistant.css'

/** Mesmo limite do servidor (server/ata-assistant.ts); repetido aqui para não levar o módulo do servidor ao navegador. */
const MAX_CHARS = 15_000
const CLIENT_TIMEOUT_MS = 30_000
const confidenceLabels: Record<AtaConfidence, string> = { alta: 'alta', media: 'média', baixa: 'baixa' }

type Phase = 'idle' | 'loading' | 'done'

interface AtaAssistantProps {
  context: AtaContext
  /** Preenche o formulário de conferência; quem chama decide o que fazer com cada valor ausente (null). */
  onApplyGrade: (grade: number | null, nominated: boolean | null) => void
  onAddTasks: (corrections: AtaCorrection[]) => void
}

function isAnalysis(value: unknown): value is AtaAnalysis {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Record<string, unknown>
  return Array.isArray(data.corrections) && Array.isArray(data.divergences) && Array.isArray(data.evaluators) && typeof data.confidence === 'string'
}

async function requestAnalysis(ataText: string, context: AtaContext, signal: AbortSignal): Promise<AtaAnalysis> {
  let response: Response
  try {
    response = await fetch('/api/ata-assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ataText, context }), signal })
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) throw new Error('A IA demorou demais para responder. Tente novamente.')
    throw new Error('Não foi possível falar com o servidor de IA. Verifique a conexão e tente novamente.')
  }
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && typeof (data as { error?: unknown }).error === 'string' ? (data as { error: string }).error : ''
    throw new Error(message || (response.status === 404 ? 'O serviço de IA não está disponível neste ambiente.' : 'A IA não conseguiu analisar a ata agora. Tente novamente.'))
  }
  if (!isAnalysis(data)) throw new Error('A IA devolveu uma resposta que não pôde ser lida. Tente novamente.')
  return data
}

function formatDate(isoDate: string) { return isoDate.split('-').reverse().join('/') }

export function AtaAssistant({ context, onApplyGrade, onAddTasks }: AtaAssistantProps) {
  const textId = useId()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<AtaAnalysis | null>(null)
  const [tasksAdded, setTasksAdded] = useState(0)
  const latestRequest = useRef(0)

  const length = text.length
  const tooLong = length > MAX_CHARS
  const loading = phase === 'loading'

  async function analyze() {
    if (!text.trim() || tooLong || loading) return
    const requestId = ++latestRequest.current
    setPhase('loading'); setError(''); setResult(null); setTasksAdded(0)
    try {
      const analysis = await requestAnalysis(text, context, AbortSignal.timeout(CLIENT_TIMEOUT_MS))
      if (requestId !== latestRequest.current) return
      setResult(analysis); setPhase('done')
    } catch (failure) {
      if (requestId !== latestRequest.current) return
      setError(failure instanceof Error ? failure.message : 'A IA não conseguiu analisar a ata agora. Tente novamente.')
      setPhase('idle')
    }
  }

  function close() {
    latestRequest.current++
    setOpen(false); setPhase((current) => current === 'loading' ? 'idle' : current)
  }

  function addTasks() {
    if (!result || result.corrections.length === 0) return
    onAddTasks(result.corrections)
    setTasksAdded(result.corrections.length)
  }

  if (!open) {
    return <div className="ata-ai"><button className="button button--small ata-ai__toggle" type="button" onClick={() => setOpen(true)}><Sparkles size={14} /> Ler ata com IA</button></div>
  }

  const count = result?.corrections.length ?? 0
  return <section className="ata-ai ata-ai__panel" aria-label="Leitura da ata com IA">
    <div className="ata-ai__intro">
      <strong>Ler ata com IA</strong>
      <p className="hint">Cole o texto da ata. A IA sugere nota, indicação e correções; nada é registrado sem a sua conferência.</p>
    </div>
    <div className="ata-ai__field">
      <label htmlFor={textId}>Texto da ata</label>
      <textarea id={textId} value={text} onChange={(event) => setText(event.target.value)} rows={7} placeholder="Cole aqui o texto da ata de defesa" aria-invalid={tooLong || undefined} disabled={loading} />
      <div className="ata-ai__meta">
        <button className="text-button" type="button" onClick={() => { setText(buildSampleAta(context)); setError('') }} disabled={loading}>Usar texto de exemplo</button>
        <span className={`ata-ai__count ${tooLong ? 'ata-ai__count--over' : ''}`}>{length.toLocaleString('pt-BR')} / {MAX_CHARS.toLocaleString('pt-BR')} caracteres</span>
      </div>
    </div>
    {tooLong && <p className="form-error" role="alert">O texto passa de {MAX_CHARS.toLocaleString('pt-BR')} caracteres. Cole só a parte da ata com a deliberação da banca.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="ata-ai__actions">
      <button className="button button--small" type="button" onClick={close}>Cancelar</button>
      <button className="button button--small button--primary" type="button" onClick={analyze} disabled={loading || !text.trim() || tooLong} aria-busy={loading}>
        {loading ? <><LoaderCircle size={14} className="ata-ai__spinner" aria-hidden="true" /> Analisando…</> : <><Sparkles size={14} /> Analisar</>}
      </button>
    </div>
    <div aria-live="polite">
      {result && <div className="ata-ai__result">
        <div className="ata-ai__result-head">
          <span className="ata-ai__badge"><Sparkles size={13} /> Sugestão de IA · confira antes de aplicar</span>
          <span className={`status ata-ai__confidence ata-ai__confidence--${result.confidence}`}>Confiança {confidenceLabels[result.confidence]}</span>
        </div>
        <dl className="ata-ai__fields">
          <div><dt>Nota</dt><dd>{result.grade === null ? <em>Não identificada</em> : result.grade.toLocaleString('pt-BR')}</dd></div>
          <div><dt>Indicação da banca</dt><dd>{result.nominated === null ? <em>Não identificada</em> : result.nominated ? 'Sim, a banca indicou' : 'Não indicou'}</dd></div>
          <div><dt>Data da defesa</dt><dd>{result.defenseDate ? formatDate(result.defenseDate) : <em>Não identificada</em>}</dd></div>
          <div><dt>Banca</dt><dd>{result.evaluators.length ? result.evaluators.join(', ') : <em>Não identificada</em>}</dd></div>
        </dl>
        {result.divergences.length > 0
          ? <div className="ata-ai__divergences" role="note">
            <strong><TriangleAlert size={14} /> Divergências com o cadastro</strong>
            <ul>{result.divergences.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          : <p className="hint ata-ai__match"><Check size={13} /> Nenhuma divergência com o cadastro encontrada.</p>}
        <div className="ata-ai__corrections">
          <span className="ata-ai__label">Correções pedidas pela banca</span>
          {count > 0
            ? <ol>{result.corrections.map((item) => <li key={item.title}><strong>{item.title}</strong><span>{item.detail}</span></li>)}</ol>
            : <p className="hint">Nenhuma correção identificada na ata.</p>}
        </div>
        <div className="ata-ai__actions ata-ai__actions--start">
          <button className="button button--small button--primary" type="button" onClick={() => onApplyGrade(result.grade, result.nominated)} disabled={result.grade === null && result.nominated === null}>Usar nota e indicação</button>
          {count > 0 && (tasksAdded > 0
            ? <span className="hint ata-ai__done"><Check size={13} /> {tasksAdded} {tasksAdded === 1 ? 'correção adicionada' : 'correções adicionadas'}</span>
            : <button className="button button--small" type="button" onClick={addTasks}>Adicionar {count} {count === 1 ? 'correção como tarefa' : 'correções como tarefas'}</button>)}
        </div>
      </div>}
    </div>
  </section>
}
