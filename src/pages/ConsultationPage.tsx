import { useMemo, useState } from 'react'
import { ExternalLink, Search, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge, statusLabel } from '../components/StatusBadge'
import type { PageProps } from '../App'
import type { DemoState } from '../domain/types'
import './ConsultationPage.css'

type Scope = 'all' | 'student' | 'advisor' | 'evaluator'
type Row = ReturnType<typeof buildRows>[number]

const scopes: Array<{ id: Scope; label: string; placeholder: string }> = [
  { id: 'all', label: 'Todos', placeholder: 'Nome ou título do trabalho' },
  { id: 'student', label: 'Aluno', placeholder: 'Nome do aluno' },
  { id: 'advisor', label: 'Orientador', placeholder: 'Nome do orientador' },
  { id: 'evaluator', label: 'Avaliador', placeholder: 'Nome do docente avaliador' },
]
const statuses = ['agendada', 'realizada', 'pendente-correcao', 'concluida']

/** Ignora maiúsculas e acentos para que "joao" encontre "João". */
const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

function buildRows(state: DemoState) {
  return state.boards.map((board) => {
    const work = state.works.find((item) => item.id === board.workId)!
    const authors = work.authorIds.map((id) => state.users.find((user) => user.id === id)!).filter(Boolean)
    const evaluatorNames = state.invitations
      .filter((invite) => invite.boardId === board.id && invite.status === 'aceito')
      .map((invite) => state.users.find((user) => user.id === invite.inviteeId)?.name)
      .filter(Boolean) as string[]
    const deposit = state.deposits.find((item) => item.workId === work.id)
    return { board, work, course: state.courses.find((course) => course.id === work.courseId)!, advisor: state.users.find((user) => user.id === work.advisorId)!, authors, evaluatorNames, deposit }
  })
}

function matchesQuery(row: Row, scope: Scope, needle: string) {
  if (!needle) return true
  const has = (names: string[]) => names.some((name) => normalize(name).includes(needle))
  const students = row.authors.map((author) => author.name)
  if (scope === 'student') return has(students)
  if (scope === 'advisor') return has([row.advisor.name])
  if (scope === 'evaluator') return has(row.evaluatorNames)
  return has([row.work.title, ...students, row.advisor.name, ...row.evaluatorNames])
}

export function ConsultationPage({ state }: PageProps) {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const [course, setCourse] = useState('')
  const [semester, setSemester] = useState('')
  const [year, setYear] = useState('')
  const [status, setStatus] = useState('')
  const rows = useMemo(() => buildRows(state), [state])
  const years = useMemo(() => [...new Set(state.boards.map((board) => board.year))].sort((a, b) => b - a), [state.boards])

  const needle = normalize(query.trim())
  // Os contadores dos chips respeitam os demais filtros, para mostrar o que cada status traria.
  const scoped = rows.filter((row) =>
    (!course || row.course.id === course) &&
    (!semester || String(row.board.semester) === semester) &&
    (!year || String(row.board.year) === year) &&
    matchesQuery(row, scope, needle))
  const results = status ? scoped.filter((row) => row.board.status === status) : scoped
  const hasFilter = Boolean(needle || course || semester || year || status)
  const activeScope = scopes.find((item) => item.id === scope)!
  const chips = [{ id: '', label: 'Todos', count: scoped.length }, ...statuses.map((id) => ({ id, label: statusLabel(id), count: scoped.filter((row) => row.board.status === id).length }))]

  const clearFilters = () => { setQuery(''); setScope('all'); setCourse(''); setSemester(''); setYear(''); setStatus('') }

  return <>
    <PageHeader title="Consulta de bancas" description="Informações acadêmicas do cenário fictício. Sem documentos internos, e-mails ou tokens." />
    <section className="panel filter-panel" role="search" aria-label="Filtros de consulta">
      <div className="filter-search">
        <label className="filter-search__field">
          <span className="sr-label">Buscar bancas</span>
          <Search size={16} />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={activeScope.placeholder} autoComplete="off" />
        </label>
        <div className="segmented">
          <span className="segmented__label" id="consulta-escopo">Buscar em</span>
          <div className="segmented__group" role="group" aria-labelledby="consulta-escopo">
            {scopes.map((item) => <button key={item.id} type="button" className="segmented__option" aria-pressed={scope === item.id} onClick={() => setScope(item.id)}>{item.label}</button>)}
          </div>
        </div>
      </div>
      <div className="filter-row">
        <div className="status-chips" role="group" aria-label="Status da banca">
          {chips.map((chip) => <button key={chip.id || 'todos'} type="button" className="status-chip" aria-pressed={status === chip.id} onClick={() => setStatus(chip.id)}>{chip.label}<span className="status-chip__count">{chip.count}</span></button>)}
        </div>
        <div className="filter-selects">
          <label><span>Curso</span><select value={course} onChange={(event) => setCourse(event.target.value)}><option value="">Todos</option>{state.courses.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label>
          <label><span>Semestre</span><select value={semester} onChange={(event) => setSemester(event.target.value)}><option value="">Todos</option><option value="1">1º</option><option value="2">2º</option></select></label>
          <label><span>Ano</span><select value={year} onChange={(event) => setYear(event.target.value)}><option value="">Todos</option>{years.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
      </div>
    </section>
    <section className="panel table-panel consultation-results" aria-labelledby="consulta-resultados">
      <h2 className="sr-label" id="consulta-resultados">Bancas encontradas</h2>
      <div className="results-bar">
        <p aria-live="polite">{hasFilter ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}` : `${results.length} ${results.length === 1 ? 'banca' : 'bancas'}`}</p>
        {hasFilter && <button type="button" className="text-button" onClick={clearFilters}><X size={14} /> Limpar filtros</button>}
      </div>
      {results.length
        ? <div className="table-scroll"><table><thead><tr><th>Trabalho</th><th>Curso e autoria</th><th>Orientador</th><th>Avaliadores</th><th>Data e local</th><th>Status</th><th>RIC-CPS</th></tr></thead><tbody>{results.map(({ board, work, course: boardCourse, advisor, authors, evaluatorNames, deposit }) => <tr key={board.id}>
          <td className="cell-title"><strong>{work.title}</strong></td>
          <td>{boardCourse.code}<small>{authors.map((author) => author.name).join(', ')}</small></td>
          <td className="cell-nowrap">{advisor.name}</td>
          <td>{evaluatorNames.length ? evaluatorNames.join(', ') : <span className="cell-muted">Não informado</span>}</td>
          <td className="cell-nowrap">{new Date(`${board.date}T12:00:00`).toLocaleDateString('pt-BR')}<small>{board.start}–{board.end} · {board.location}</small></td>
          <td><StatusBadge status={board.status} /></td>
          <td className="cell-nowrap">{deposit?.status === 'registrado' && deposit.receiptUrl
            ? <a className="inline-link" href={deposit.receiptUrl} target="_blank" rel="noreferrer">Ver registro <ExternalLink size={12} /></a>
            : <span className="cell-muted">{deposit?.status === 'registrado' ? 'Registrado' : deposit?.status === 'encaminhado' ? 'Na biblioteca' : '—'}</span>}</td>
        </tr>)}</tbody></table></div>
        : <div className="empty-state"><span><Search size={18} /></span><div><strong>Nenhuma banca encontrada</strong><p>Remova alguns filtros para ver resultados.</p></div></div>}
      <p className="table-note">Consulta livre, sem cadastro (Art. 15). Dados fictícios; os metadados públicos dependem da coordenação.</p>
    </section>
  </>
}
