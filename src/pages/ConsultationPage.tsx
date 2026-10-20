import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import type { PageProps } from '../App'
import './ConsultationPage.css'

export function ConsultationPage({ state }: PageProps) {
  const [filters, setFilters] = useState({ course: '', student: '', advisor: '', evaluator: '', semester: '', year: '', status: '' })
  const rows = useMemo(() => state.boards.map((board) => {
    const work = state.works.find((item) => item.id === board.workId)!
    const authors = work.authorIds.map((id) => state.users.find((user) => user.id === id)!).filter(Boolean)
    const evaluatorNames = state.invitations.filter((invite) => invite.boardId === board.id && invite.status === 'aceito').map((invite) => state.users.find((user) => user.id === invite.inviteeId)?.name).filter(Boolean) as string[]
    return { board, work, course: state.courses.find((course) => course.id === work.courseId)!, advisor: state.users.find((user) => user.id === work.advisorId)!, authors, evaluatorNames }
  }).filter(({ board, course, advisor, authors, evaluatorNames }) =>
    (!filters.course || course.id === filters.course) &&
    (!filters.student || authors.some((author) => author.name.toLowerCase().includes(filters.student.toLowerCase()))) &&
    (!filters.advisor || advisor.name.toLowerCase().includes(filters.advisor.toLowerCase())) &&
    (!filters.evaluator || evaluatorNames.some((name) => name.toLowerCase().includes(filters.evaluator.toLowerCase()))) &&
    (!filters.semester || String(board.semester) === filters.semester) &&
    (!filters.year || String(board.year) === filters.year) &&
    (!filters.status || board.status === filters.status),
  ), [state, filters])
  const update = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }))
  const hasFilter = Object.values(filters).some(Boolean)
  return <>
    <PageHeader title="Consulta de bancas" description="Informações acadêmicas do cenário fictício. Sem documentos internos, e-mails ou tokens." />
    <section className="panel search-panel" aria-label="Filtros combinados">
      <div className="panel-heading"><div><h2>Filtrar bancas</h2><p>Os campos combinam entre si.</p></div><Search size={18} /></div>
      <div className="search-filters">
        <label>Curso<select value={filters.course} onChange={(event) => update('course', event.target.value)}><option value="">Todos</option>{state.courses.map((course) => <option key={course.id} value={course.id}>{course.code}</option>)}</select></label>
        <label>Aluno<input value={filters.student} onChange={(event) => update('student', event.target.value)} placeholder="Nome do aluno" /></label>
        <label>Orientador<input value={filters.advisor} onChange={(event) => update('advisor', event.target.value)} placeholder="Nome do orientador" /></label>
        <label>Docente avaliador<input value={filters.evaluator} onChange={(event) => update('evaluator', event.target.value)} placeholder="Nome do docente" /></label>
        <label>Semestre<select value={filters.semester} onChange={(event) => update('semester', event.target.value)}><option value="">Todos</option><option value="1">1º</option><option value="2">2º</option></select></label>
        <label>Ano<select value={filters.year} onChange={(event) => update('year', event.target.value)}><option value="">Todos</option>{[...new Set(state.boards.map((board) => board.year))].sort((a, b) => b - a).map((year) => <option key={year}>{year}</option>)}</select></label>
        <label>Status<select value={filters.status} onChange={(event) => update('status', event.target.value)}><option value="">Todos</option>{['agendada', 'realizada', 'pendente-correcao', 'concluida'].map((status) => <option key={status} value={status}>{status.replaceAll('-', ' ')}</option>)}</select></label>
        {hasFilter && <button className="button button--quiet clear-filters" onClick={() => setFilters({ course: '', student: '', advisor: '', evaluator: '', semester: '', year: '', status: '' })}><X size={15} /> Limpar filtros</button>}
      </div>
    </section>
    <section className="panel table-panel consultation-results"><div className="panel-heading"><div><h2>Bancas encontradas</h2><p>{rows.length} resultado(s)</p></div></div>
      {rows.length ? <div className="table-scroll"><table><thead><tr><th>Trabalho</th><th>Curso e autoria</th><th>Orientador</th><th>Avaliadores</th><th>Data e local</th><th>Status</th></tr></thead><tbody>{rows.map(({ board, work, course, advisor, authors, evaluatorNames }) => <tr key={board.id}><td><strong>{work.title}</strong></td><td>{course.code}<small>{authors.map((author) => author.name).join(', ')}</small></td><td>{advisor.name}</td><td>{evaluatorNames.join(', ') || 'Não informado'}</td><td>{new Date(`${board.date}T12:00:00`).toLocaleDateString('pt-BR')}<small>{board.start}–{board.end} · {board.location}</small></td><td><StatusBadge status={board.status} /></td></tr>)}</tbody></table></div> : <div className="empty-state"><span><Search size={18} /></span><div><strong>Nenhuma banca encontrada</strong><p>Remova alguns filtros ou limpe a busca para ver resultados.</p></div></div>}
      <p className="table-note">Consulta de demonstração. Os dados não confirmam publicação institucional.</p>
    </section>
  </>
}
