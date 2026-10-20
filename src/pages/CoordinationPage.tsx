import { useMemo } from 'react'
import { AlertCircle, CheckCircle2, ClipboardCheck, PenLine } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { correctionDeadline, daysBetween, libraryDeadline, suggestedAccessLevel } from '../domain/rules'
import type { PageProps } from '../App'
import type { BoardDocument, TermData } from '../domain/types'
import './ConsultationPage.css'

export function CoordinationPage({ state, setState, viewer, notify }: PageProps) {
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

  function signTerm(document: BoardDocument, boardId: string) {
    if (!window.confirm('Confirmar que a assinatura do coordenador do curso consta no Termo de Autorização anexado?')) return
    const board = state.boards.find((item) => item.id === boardId)
    const now = new Date().toISOString()
    const base: TermData = document.term ?? { accessLevel: suggestedAccessLevel(board?.grade, board?.nominatedByBoard), fundingAgency: 'nao', correctionsDeclared: false, signatures: { authors: false, advisor: false, coordinator: false } }
    setState((current) => ({
      ...current,
      documents: current.documents.map((item) => item.id === document.id ? { ...item, term: { ...base, signatures: { ...base.signatures, coordinator: true }, coordinatorSignedBy: viewer.id, coordinatorSignedAt: now } } : item),
      history: [...current.history, { id: `h-${Date.now().toString(36)}`, boardId, at: now, actorId: viewer.id, label: 'Assinatura do coordenador confirmada', detail: `Coordenação confirmou a assinatura no TA ${document.file?.name ?? ''}.` }],
    }))
    notify({ kind: 'success', message: 'Assinatura do coordenador registrada no TA.' })
  }

  return <>
    <PageHeader title="Pendências da coordenação" description="Prazos de correção e de biblioteca, assinatura do coordenador no Termo de Autorização e situação do depósito." />
    <div className="overview-strip coordination-summary">
      <div className="summary-item summary-item--red"><span className="summary-item__label">TA aguardando assinatura</span><strong>{awaitingSignature.length}</strong><small>coordenador do curso</small></div>
      <div className="summary-item summary-item--amber"><span className="summary-item__label">Correção em atraso</span><strong>{lateCorrections.length}</strong><small>15 dias sem versão aprovada</small></div>
      <div className="summary-item summary-item--blue"><span className="summary-item__label">Na biblioteca</span><strong>{rows.filter((row) => row.deposit.status === 'encaminhado').length}</strong><small>aguardam submissão no RIC-CPS</small></div>
      <div className="summary-item summary-item--green"><span className="summary-item__label">Depositados</span><strong>{rows.filter((row) => row.deposit.status === 'registrado').length}</strong><small>registrados pelo bibliotecário</small></div>
    </div>
    {awaitingSignature.length > 0 && <section className="panel table-panel"><div className="panel-heading"><div><h2>Assinar Termos de Autorização</h2><p>O Anexo C exige a assinatura do coordenador do curso.</p></div><PenLine size={18} /></div>
      <div className="table-scroll"><table><thead><tr><th>Trabalho</th><th>Arquivo do TA</th><th>Nota · indicação</th><th>Ação</th></tr></thead><tbody>{awaitingSignature.map(({ work, board, term }) => <tr key={work.id}><td><strong>{work.title}</strong><small>{state.courses.find((course) => course.id === work.courseId)?.code}</small></td><td>{term!.file!.name}</td><td>{board!.grade?.toLocaleString('pt-BR') ?? '—'} · {board!.nominatedByBoard ? 'indicado' : 'não indicado'}</td><td><button className="button button--small button--primary" onClick={() => signTerm(term!, board!.id)}><PenLine size={14} /> Confirmar assinatura</button></td></tr>)}</tbody></table></div>
    </section>}
    <section className="panel table-panel"><div className="panel-heading"><div><h2>Acompanhamento</h2><p>Situação acadêmica, documentos e depósito são etapas separadas.</p></div><ClipboardCheck size={18} /></div><div className="table-scroll"><table><thead><tr><th>Trabalho</th><th>Orientador</th><th>Status</th><th>Prazo de correção</th><th>Versão aprovada</th><th>TA</th><th>Prazo biblioteca</th><th>Depósito</th></tr></thead><tbody>{rows.map(({ work, board, deposit, version, term, advisor }) => {
      const correction = correctionDeadline(board!.date)
      const correctionLeft = daysBetween(today, correction)
      const library = libraryDeadline(board!.semester, board!.year)
      return <tr key={work.id}><td><strong>{work.title}</strong><small>{state.courses.find((course) => course.id === work.courseId)?.code} · {work.authorIds.map((id) => state.users.find((user) => user.id === id)?.name).join(', ')}</small></td><td>{advisor?.name}</td><td><StatusBadge status={board!.status} /></td>
        <td>{formatDate(correction)}<small className={!version && correctionLeft < 0 ? 'late-label' : ''}>{version ? 'Cumprido' : correctionLeft < 0 ? `Atraso de ${-correctionLeft} dia(s)` : `${correctionLeft} dia(s)`}</small></td>
        <td>{version ? `v${version.number}` : 'Ainda não'}</td>
        <td><StatusBadge status={term?.status ?? 'pendente'} />{term?.file && !term.term?.signatures.coordinator && <small>Falta assinatura do coordenador</small>}</td>
        <td>{formatDate(library)}<small>{deposit.status === 'nao-encaminhado' ? `${daysBetween(today, library)} dia(s)` : 'Encaminhado'}</small></td>
        <td><StatusBadge status={deposit.status} />{deposit.recordedAt && <small><CheckCircle2 size={12} /> {new Date(deposit.recordedAt).toLocaleDateString('pt-BR')}</small>}</td></tr>
    })}</tbody></table></div><p className="table-note"><AlertCircle size={14} /> Atraso é aviso, sem bloqueio. O prazo da biblioteca usa o fim de semestre do calendário demonstrativo; a unidade define o calendário real.</p></section>
  </>
}

function formatDate(date: string) { return date.split('-').reverse().join('/') }
