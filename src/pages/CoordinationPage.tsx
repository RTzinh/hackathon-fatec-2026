import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, Filter, PenLine, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { correctionDeadline, daysBetween, libraryDeadline, suggestedAccessLevel } from '../domain/rules'
import type { PageProps } from '../App'
import type { BoardDocument, TermData } from '../domain/types'
import './ConsultationPage.css'

type FilterKey = 'ta' | 'late' | 'library' | 'deposited'

export function CoordinationPage({ state, setState, viewer, notify }: PageProps) {
  const [filter, setFilter] = useState<FilterKey | null>(null)
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const rows = useMemo(() => state.works.map((work) => {
    const board = state.boards.find((item) => item.workId === work.id)
    const deposit = state.deposits.find((item) => item.workId === work.id) ?? { workId: work.id, status: 'nao-encaminhado' as const }
    const version = state.versions.find((item) => item.workId === work.id && item.status === 'aprovada')
    const term = state.documents.find((item) => item.boardId === board?.id && item.kind === 'autorizacao-ric-cps')
    return { work, board, deposit, version, term, advisor: state.users.find((user) => user.id === work.advisorId) }
  }).filter((row) => row.board && row.board.status !== 'agendada'), [state])
  const awaitingSignature = rows.filter((row) => row.term?.file && !row.term.term?.signatures.coordinator)
  const lateCorrections = rows.filter((row) => row.board?.status !== 'concluida' && !row.version && daysBetween(today, correctionDeadline(row.board!.date)) < 0)
  const inLibrary = rows.filter((row) => row.deposit.status === 'encaminhado')
  const deposited = rows.filter((row) => row.deposit.status === 'registrado')

  const cards: Array<{ key: FilterKey; tone: 'red' | 'amber' | 'blue' | 'green'; label: string; hint: string; items: typeof rows }> = [
    { key: 'ta', tone: 'amber', label: 'TA aguardando assinatura', hint: 'coordenador do curso', items: awaitingSignature },
    { key: 'late', tone: 'red', label: 'Correção em atraso', hint: '15 dias sem versão aprovada', items: lateCorrections },
    { key: 'library', tone: 'blue', label: 'Na biblioteca', hint: 'aguardam submissão no RIC-CPS', items: inLibrary },
    { key: 'deposited', tone: 'green', label: 'Depositados', hint: 'registrados pelo bibliotecário', items: deposited },
  ]
  const active = cards.find((card) => card.key === filter)
  const visible = active ? active.items : rows

  function signTerm(document: BoardDocument, boardId: string) {
    const board = state.boards.find((item) => item.id === boardId)
    const now = new Date().toISOString()
    const base: TermData = document.term ?? { accessLevel: suggestedAccessLevel(board?.grade, board?.nominatedByBoard), fundingAgency: 'nao', correctionsDeclared: false, signatures: { authors: false, advisor: false, coordinator: false } }
    setState((current) => ({
      ...current,
      documents: current.documents.map((item) => item.id === document.id ? { ...item, term: { ...base, signatures: { ...base.signatures, coordinator: true }, coordinatorSignedBy: viewer.id, coordinatorSignedAt: now } } : item),
      history: [...current.history, { id: `h-${Date.now().toString(36)}`, boardId, at: now, actorId: viewer.id, label: 'Assinatura do coordenador confirmada', detail: `Coordenação confirmou a assinatura no TA ${document.file?.name ?? ''}.` }],
    }))
    notify({ kind: 'success', message: 'Assinatura do coordenador registrada no TA (conferência manual, sem validar o arquivo).', undo: true })
  }

  return <>
    <PageHeader title="Pendências da coordenação" description="Prazos, assinaturas do Termo de Autorização e depósitos." />
    <div className="overview-strip coordination-summary" role="group" aria-label="Indicadores. Selecione um para filtrar o acompanhamento">
      {cards.map((card) => {
        const isActive = filter === card.key
        return <button key={card.key} type="button" className={`summary-item summary-item--${card.tone} summary-filter${isActive ? ' summary-filter--active' : ''}`} aria-pressed={isActive} onClick={() => setFilter(isActive ? null : card.key)}>
          <span className="summary-item__label">{card.label}</span>
          <strong>{card.items.length}</strong>
          <small>{isActive ? 'Filtro ativo · clique para limpar' : card.hint}</small>
        </button>
      })}
    </div>
    {awaitingSignature.length > 0 && <section className="panel table-panel" aria-labelledby="coord-assinar"><div className="panel-heading"><div><h2 id="coord-assinar">Assinar Termos de Autorização</h2><p>Confirme só se a assinatura do coordenador do curso consta no arquivo anexado (Anexo C).</p></div><PenLine size={18} /></div>
      <ul className="queue-list">{awaitingSignature.map(({ work, board, term }) => <li key={work.id} className="queue-item">
        <div className="queue-item__row">
          <div className="queue-item__title">
            <h3>{work.title}</h3>
            <p>{state.courses.find((course) => course.id === work.courseId)?.code} · nota {board!.grade?.toLocaleString('pt-BR') ?? '—'} · {board!.nominatedByBoard ? 'indicado' : 'não indicado'}</p>
          </div>
          <dl className="queue-item__facts"><div><dt>Arquivo do TA</dt><dd className="cell-file">{term!.file!.name}</dd></div></dl>
          <button className="button button--small button--primary" onClick={() => signTerm(term!, board!.id)}><PenLine size={14} /> Confirmar assinatura</button>
        </div>
      </li>)}</ul>
    </section>}
    <section className="panel table-panel" aria-labelledby="coord-acompanhamento"><div className="panel-heading"><div><h2 id="coord-acompanhamento">Acompanhamento</h2><p aria-live="polite">{active ? `${visible.length} de ${rows.length} trabalhos · ${active.label}` : `${rows.length} trabalhos · selecione um indicador acima para filtrar`}</p></div>
      {active ? <button type="button" className="text-button" onClick={() => setFilter(null)}><X size={14} /> Limpar filtro</button> : <ClipboardCheck size={18} />}</div>
      {visible.length ? <div className="table-scroll"><table><thead><tr><th>Trabalho</th><th>Orientador</th><th>Status</th><th>Correção</th><th>TA</th><th>Depósito</th></tr></thead><tbody>{visible.map(({ work, board, deposit, version, term, advisor }) => {
        const correction = correctionDeadline(board!.date)
        const correctionLeft = daysBetween(today, correction)
        const isLate = lateCorrections.some((row) => row.work.id === work.id)
        const library = libraryDeadline(board!.semester, board!.year)
        const libraryLeft = daysBetween(today, library)
        const awaiting = Boolean(term?.file && !term.term?.signatures.coordinator)
        return <tr key={work.id}>
          <td className="cell-title"><strong>{work.title}</strong><small>{state.courses.find((course) => course.id === work.courseId)?.code} · {work.authorIds.map((id) => state.users.find((user) => user.id === id)?.name).join(', ')}</small></td>
          <td className="cell-nowrap">{advisor?.name}</td>
          <td><StatusBadge status={board!.status} /></td>
          <td className="cell-nowrap">{version
            ? <span className="cell-ok">v{version.number} aprovada</span>
            : <span className={isLate ? 'cell-late' : undefined}>{correctionLeft < 0 ? `Atraso de ${plural(-correctionLeft)}` : correctionLeft === 0 ? 'Vence hoje' : `${plural(correctionLeft)} ${correctionLeft === 1 ? 'restante' : 'restantes'}`}</span>}
            <small>Prazo {formatDate(correction)}</small></td>
          <td><StatusBadge status={term?.status ?? 'pendente'} />{awaiting && <small className="cell-warn">Falta assinatura do coordenador</small>}</td>
          <td className="cell-nowrap"><StatusBadge status={deposit.status} />
            {deposit.recordedAt
              ? <small><CheckCircle2 size={12} /> Registrado em {new Date(deposit.recordedAt).toLocaleDateString('pt-BR')}</small>
              : <small className={deposit.status === 'nao-encaminhado' && libraryLeft < 0 ? 'cell-late' : undefined}>Prazo {formatDate(library)}{deposit.status === 'nao-encaminhado' && ` · ${libraryLeft < 0 ? `atraso de ${plural(-libraryLeft)}` : plural(libraryLeft)}`}</small>}
          </td></tr>
      })}</tbody></table></div>
        : <div className="empty-state"><span><Filter size={18} /></span><div><strong>Nenhum trabalho nesta situação</strong><p>Limpe o filtro para ver todos os trabalhos.</p></div></div>}
      <p className="table-note">Atraso é aviso, sem bloqueio. O prazo da biblioteca usa o calendário demonstrativo; a unidade define o real.</p></section>
  </>
}

function formatDate(date: string) { return date.split('-').reverse().join('/') }
function plural(days: number) { return `${days} ${days === 1 ? 'dia' : 'dias'}` }
