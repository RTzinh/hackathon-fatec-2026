import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertTriangle, ArrowRight, CalendarCheck, Check, Clock3, Mail, Plus, Users, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { detectConflicts, suggestAlternativeSlots } from '../domain/rules'
import type { Availability, DefenseBoard, Invitation } from '../domain/types'
import type { PageProps } from '../App'
import './SchedulePage.css'

type Draft = {
  title: string; courseId: string; authorIds: string[]; advisorId: string; evaluatorIds: string[]; workType: string; hasProduct: boolean
  date: string; start: string; end: string; modality: 'presencial' | 'online' | 'hibrida'; location: string
}
type Filter = 'todas' | DefenseBoard['status']

const filters: Array<{ id: Filter; label: string }> = [
  { id: 'todas', label: 'Todas' },
  { id: 'agendada', label: 'Agendadas' },
  { id: 'realizada', label: 'Realizadas' },
  { id: 'pendente-correcao', label: 'Em correção' },
  { id: 'concluida', label: 'Concluídas' },
]

const initialDraft = (advisorId: string): Draft => ({
  title: '', courseId: '', authorIds: [], advisorId, evaluatorIds: [], workType: 'Monografia', hasProduct: false,
  date: '2026-10-23', start: '14:00', end: '15:30', modality: 'presencial', location: '',
})

export function SchedulePage({ state, setState, viewer, navigate, notify }: PageProps) {
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => initialDraft(viewer.id))
  const [formError, setFormError] = useState('')
  const [filter, setFilter] = useState<Filter>('todas')
  const [freshId, setFreshId] = useState('')
  const [replacementFor, setReplacementFor] = useState('')
  const [replacementId, setReplacementId] = useState('')
  const conflicts = useMemo(() => draft.date && draft.start && draft.end && draft.location && draft.evaluatorIds.length
    ? detectConflicts(draft, state.boards, state.invitations, state.availabilities)
    : [], [draft, state.boards, state.invitations, state.availabilities])
  const alternatives = useMemo(() => conflicts.length && draft.date && draft.evaluatorIds.length
    ? suggestAlternativeSlots(draft.date, duration(draft.start, draft.end), draft.evaluatorIds, state.availabilities, state.boards, state.invitations, draft.location)
    : [], [conflicts, draft, state.availabilities, state.boards, state.invitations])
  const advisors = state.users.filter((user) => user.role === 'orientador')
  const students = state.users.filter((user) => user.role === 'aluno')
  const guests = state.users.filter((user) => user.role === 'convidado')
  // Agendadas primeiro, da mais próxima para a mais distante; depois o restante, do mais recente para o mais antigo.
  const orderedBoards = [...state.boards].sort((a, b) => {
    const aUpcoming = a.status === 'agendada'
    const bUpcoming = b.status === 'agendada'
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
    const order = `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)
    return aUpcoming ? order : -order
  })
  const visibleBoards = filter === 'todas' ? orderedBoards : orderedBoards.filter((board) => board.status === filter)
  const countOf = (id: Filter) => id === 'todas' ? state.boards.length : state.boards.filter((board) => board.status === id).length

  useEffect(() => {
    if (!freshId) return
    const timer = window.setTimeout(() => setFreshId(''), 4000)
    return () => window.clearTimeout(timer)
  }, [freshId])

  function toggleDraftId(key: 'authorIds' | 'evaluatorIds', id: string) {
    setDraft((current) => ({ ...current, [key]: current[key].includes(id) ? current[key].filter((value) => value !== id) : [...current[key], id] }))
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    if (!draft.title.trim() || !draft.courseId || !draft.authorIds.length || !draft.advisorId || !draft.evaluatorIds.length || !draft.date || !draft.start || !draft.end || !draft.location.trim()) {
      setFormError('Preencha trabalho, curso, autoria, orientador, avaliadores, data, horário e local ou link.')
      return
    }
    if (draft.end <= draft.start) { setFormError('O término precisa ser posterior ao início.'); return }

    const suffix = Date.now().toString(36)
    const workId = `w-${suffix}`
    const boardId = `b-${suffix}`
    const now = new Date().toISOString()
    const newWork = { id: workId, title: draft.title.trim(), courseId: draft.courseId, advisorId: draft.advisorId, authorIds: draft.authorIds, workType: draft.workType, hasProduct: draft.hasProduct, updatedAt: now }
    const newBoard: DefenseBoard = { id: boardId, workId, date: draft.date, start: draft.start, end: draft.end, modality: draft.modality, location: draft.location.trim(), status: 'agendada', semester: Number(draft.date.slice(5, 7)) <= 6 ? 1 : 2, year: Number(draft.date.slice(0, 4)) }
    const invites: Invitation[] = draft.evaluatorIds.map((inviteeId, index) => ({ id: `i-${suffix}-${index}`, boardId, inviteeId, status: 'pendente', token: `demo-${suffix}-${index}`, expiresAt: `${draft.date}T23:59:00`, sentAt: now }))
    setState((current) => ({
      ...current,
      works: [...current.works, newWork],
      workAuthors: [...current.workAuthors, ...draft.authorIds.map((userId) => ({ workId, userId }))],
      boards: [...current.boards, newBoard],
      invitations: [...current.invitations, ...invites],
      documents: [...current.documents, { id: `doc-${suffix}-ata`, boardId, kind: 'ata', status: 'pendente' }, { id: `doc-${suffix}-ric`, boardId, kind: 'autorizacao-ric-cps', status: 'pendente' }],
      deposits: [...current.deposits, { workId, status: 'nao-encaminhado' }],
      outbox: [...current.outbox, ...invites.map((invite) => ({ id: `mail-${invite.id}`, invitationId: invite.id, sentAt: now, state: 'simulado' as const }))],
      history: [...current.history, { id: `h-${suffix}`, boardId, at: now, actorId: viewer.id, label: 'Banca cadastrada', detail: 'Convites adicionados à caixa de saída demonstrativa.' }],
    }))
    const hadConflicts = conflicts.length > 0
    setDraft(initialDraft(viewer.id))
    setShowForm(false)
    setFilter('todas')
    setFreshId(boardId)
    notify({
      kind: 'success',
      message: `Banca cadastrada${hadConflicts ? ' com conflito de agenda, para revisão humana' : ''}. ${invites.length} convite(s) na caixa de saída.`,
      undo: true,
    })
  }

  function replaceInvite(invitation: Invitation) {
    if (!replacementId) return
    const replacement = guests.find((guest) => guest.id === replacementId)
    if (!replacement) return
    const now = new Date().toISOString()
    const suffix = Date.now().toString(36)
    const nextInvite: Invitation = { id: `i-${suffix}`, boardId: invitation.boardId, inviteeId: replacement.id, status: 'pendente', token: `demo-${suffix}`, expiresAt: `${state.boards.find((board) => board.id === invitation.boardId)?.date}T23:59:00`, sentAt: now }
    setState((current) => ({
      ...current,
      invitations: [...current.invitations, nextInvite],
      outbox: [...current.outbox, { id: `mail-${suffix}`, invitationId: nextInvite.id, sentAt: now, state: 'simulado' }],
      history: [...current.history, { id: `h-${suffix}`, boardId: invitation.boardId, at: now, actorId: viewer.id, label: 'Convidado substituído', detail: `${replacement.name} recebeu um convite demonstrativo. O convite recusado permanece no histórico.` }],
    }))
    setReplacementFor('')
    setReplacementId('')
    notify({ kind: 'success', message: `Convite demonstrativo criado para ${replacement.name}.`, undo: true })
  }

  function markHeld(board: DefenseBoard) {
    const accepted = state.invitations.filter((invite) => invite.boardId === board.id && invite.status === 'aceito').length
    const future = board.date > new Date().toISOString().slice(0, 10)
    const warnings = [future && 'a data ainda não tenha chegado', !accepted && 'nenhum convidado tenha aceitado'].filter(Boolean)
    const now = new Date().toISOString()
    setState((current) => ({
      ...current,
      boards: current.boards.map((item) => item.id === board.id ? { ...item, status: 'realizada' } : item),
      history: [...current.history, { id: `h-${Date.now().toString(36)}`, boardId: board.id, at: now, actorId: viewer.id, label: 'Defesa realizada', detail: 'Próximo passo: anexar a ata e registrar nota e indicação.' }],
    }))
    notify({
      kind: 'success',
      message: `Defesa registrada${warnings.length ? `, embora ${warnings.join(' e ')}` : ''}. Anexe a ata em Pós-banca.`,
      undo: true,
    })
  }

  return <>
    <PageHeader title="Agenda e bancas" description="Cadastre trabalhos, forme a banca e acompanhe as confirmações." actions={<button className="button button--primary" aria-expanded={showForm} onClick={() => setShowForm((visible) => !visible)}>{showForm ? <X size={16} /> : <Plus size={16} />}{showForm ? 'Fechar cadastro' : 'Cadastrar banca'}</button>} />
    {showForm && <section className="panel form-panel" aria-labelledby="new-board-title">
      <div className="panel-heading"><div><h2 id="new-board-title">Nova banca de TCC</h2><p>Os convites vão para a caixa de saída ao salvar.</p></div><span className="simulation-tag"><Mail size={14} /> E-mail simulado</span></div>
      <form className="form-body" onSubmit={submit}>
        <section className="form-step" aria-labelledby="step-work">
          <div className="form-step__head"><span className="form-step__num" aria-hidden="true">1</span><h3 id="step-work">Trabalho e autoria</h3></div>
          <div className="form-grid">
            <label className="field col-6"><span>Título do trabalho <b>*</b></span><input autoFocus autoComplete="off" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ex.: Plataforma de apoio à pesquisa aplicada" /></label>
            <label className="field col-3"><span>Curso <b>*</b></span><select value={draft.courseId} onChange={(event) => setDraft({ ...draft, courseId: event.target.value })}><option value="">Selecione um curso</option>{state.courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}</select></label>
            <label className="field col-3"><span>Orientador <b>*</b></span><select value={draft.advisorId} onChange={(event) => setDraft({ ...draft, advisorId: event.target.value })}>{advisors.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisor.name}</option>)}</select></label>
            <label className="field col-3"><span>Tipo do trabalho <b>*</b></span><select value={draft.workType} onChange={(event) => setDraft({ ...draft, workType: event.target.value })}>{['Monografia', 'Artigo', 'Relatório técnico', 'Projeto aplicado', 'Protótipo', 'PDI'].map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="choice col-3 field-checkbox"><input type="checkbox" checked={draft.hasProduct} onChange={(event) => setDraft({ ...draft, hasProduct: event.target.checked })} /><span>Possui produto complementar<small>Software, protótipo, jogo etc. (zipado, vai ao RIC-CPS)</small></span></label>
            <fieldset className="field col-6"><legend>Aluno(s) <b>*</b></legend><div className="choice-grid choice-grid--compact">{students.map((student) => <label className="choice" key={student.id}><input type="checkbox" checked={draft.authorIds.includes(student.id)} onChange={() => toggleDraftId('authorIds', student.id)} /><span>{student.name}</span></label>)}</div></fieldset>
          </div>
        </section>

        <section className="form-step" aria-labelledby="step-when">
          <div className="form-step__head"><span className="form-step__num" aria-hidden="true">2</span><h3 id="step-when">Data e local</h3>{conflicts.length > 0 && <span className="form-step__flag"><AlertTriangle size={13} /> Conflito de agenda</span>}</div>
          <div className="form-grid">
            <label className="field col-2"><span>Data <b>*</b></span><input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
            <label className="field col-time"><span>Início <b>*</b></span><input type="time" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} /></label>
            <label className="field col-time"><span>Término <b>*</b></span><input type="time" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} /></label>
            <label className="field col-2"><span>Modalidade <b>*</b></span><select value={draft.modality} onChange={(event) => setDraft({ ...draft, modality: event.target.value as Draft['modality'] })}><option value="presencial">Presencial</option><option value="online">Online</option><option value="hibrida">Híbrida</option></select></label>
            <label className="field col-4"><span>{draft.modality === 'presencial' ? 'Sala / local' : 'Local ou link'} <b>*</b></span><input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder={draft.modality === 'presencial' ? 'Ex.: Sala B-203' : 'Ex.: sala ou endereço da reunião'} /></label>
          </div>
        </section>

        <section className="form-step" aria-labelledby="step-guests">
          <div className="form-step__head"><span className="form-step__num" aria-hidden="true">3</span><h3 id="step-guests">Avaliadores convidados</h3></div>
          <div className="choice-grid">{guests.map((guest) => <label className="choice" key={guest.id}><input type="checkbox" checked={draft.evaluatorIds.includes(guest.id)} onChange={() => toggleDraftId('evaluatorIds', guest.id)} /><span>{guest.name}<small>{availabilityNote(guest.id, draft.date, state.availabilities) || guest.email}</small></span></label>)}</div>
          <p className="field-note">Esta demonstração não define composição mínima da banca.</p>
        </section>

        {conflicts.length > 0 && <div className="conflict-box" role="alert">
          <AlertTriangle size={18} />
          <div className="conflict-box__body">
            <strong>Conflito de agenda encontrado</strong>
            <ul>{conflicts.map((conflict) => <li key={conflict}>{conflict}</li>)}</ul>
            {alternatives.length > 0 && <div className="alternative-row"><span>Horários livres para todos:</span>{alternatives.map((slot) => <button type="button" className="button button--small" key={`${slot.start}-${slot.end}`} onClick={() => setDraft({ ...draft, start: slot.start, end: slot.end })}><Clock3 size={14} /> {slot.start}–{slot.end}</button>)}</div>}
            <p>Revise o horário ou salve mesmo assim, para avaliação humana.</p>
          </div>
        </div>}
        {formError && <div className="form-error" role="alert">{formError}</div>}
        <div className="form-actions">
          <span><b>*</b> Campos obrigatórios</span>
          <div>
            <button className="button button--quiet" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="button button--primary" type="submit">{conflicts.length ? <><AlertTriangle size={16} /> Salvar mesmo com conflito</> : <><Check size={16} /> Salvar e preparar convites</>}</button>
          </div>
        </div>
      </form>
    </section>}

    <section className="panel schedule-list-panel" aria-labelledby="board-list-title">
      <div className="panel-heading"><div><h2 id="board-list-title">Bancas cadastradas</h2><p>{filter === 'todas' ? `${state.boards.length} no total` : `${visibleBoards.length} de ${state.boards.length}`}</p></div></div>
      <div className="board-filter" role="group" aria-label="Filtrar por situação da banca">
        {filters.map(({ id, label }) => <button key={id} type="button" className="filter-chip" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}<span className="filter-chip__count">{countOf(id)}</span></button>)}
      </div>
      {visibleBoards.length === 0 ? <div className="empty-state board-empty"><span><CalendarCheck size={18} /></span><div><strong>{state.boards.length ? 'Nenhuma banca neste filtro' : 'Nenhuma banca cadastrada'}</strong><p>{state.boards.length ? <button className="text-button" onClick={() => setFilter('todas')}>Ver todas</button> : 'Use “Cadastrar banca” para começar.'}</p></div></div>
        : <ul className="board-list">{visibleBoards.map((board) => {
          const work = state.works.find((item) => item.id === board.workId)!
          const course = state.courses.find((item) => item.id === work.courseId)!
          const advisor = state.users.find((item) => item.id === work.advisorId)!
          const authors = work.authorIds.map((id) => state.users.find((user) => user.id === id)?.name).filter(Boolean).join(', ')
          const boardInvitations = state.invitations.filter((invite) => invite.boardId === board.id)
          const declined = boardInvitations.find((invite) => invite.status === 'recusado')
          const day = new Date(`${board.date}T12:00:00`)
          return <li className={`board-row board-row--${board.status} ${freshId === board.id ? 'board-row--new' : ''}`} key={board.id}>
            <div className="board-row__when">
              <time dateTime={board.date}><strong>{String(day.getDate()).padStart(2, '0')}</strong><span>{day.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')} {day.getFullYear()}</span></time>
              <small>{board.start}–{board.end}</small>
            </div>
            <div className="board-row__body">
              <div className="board-row__head"><h3>{work.title}</h3><StatusBadge status={board.status} /></div>
              <p className="board-row__people">{authors} · {course.code}</p>
              <p className="board-row__meta">{modalityLabel(board.modality)} · {board.location} · Orientador(a): {advisor.name}</p>
              <div className="board-row__foot">
                {boardInvitations.length > 0 ? <ul className="invite-chips" aria-label="Convidados">{boardInvitations.map((invite) => {
                  const guest = state.users.find((user) => user.id === invite.inviteeId)
                  return <li key={invite.id} className={`invite-chip invite-chip--${invite.status}`} title={guest?.name}><span className="invite-chip__dot" aria-hidden="true" /><span>{guest?.name.split(' ')[0]}</span><span className="invite-chip__state">{inviteLabel(invite.status)}</span></li>
                })}</ul> : <span className="board-row__none">Sem convidados</span>}
                {board.status === 'agendada'
                  ? <button className="button button--small" onClick={() => markHeld(board)}><CalendarCheck size={14} /> Registrar realização</button>
                  : <button className="text-button" onClick={() => navigate('post-defense', board.id)}>Abrir pós-banca <ArrowRight size={14} /></button>}
              </div>
              {declined && <div className="replacement">
                <button className="text-button" aria-expanded={replacementFor === board.id} onClick={() => setReplacementFor(replacementFor === board.id ? '' : board.id)}><Users size={14} /> Substituir convidado que recusou</button>
                {replacementFor === board.id && <div className="replacement-form"><label className="sr-only" htmlFor={`replacement-${board.id}`}>Escolher convidado substituto</label><select id={`replacement-${board.id}`} value={replacementId} onChange={(event) => setReplacementId(event.target.value)}><option value="">Selecionar docente</option>{guests.filter((guest) => !boardInvitations.some((invite) => invite.inviteeId === guest.id && invite.status !== 'recusado')).map((guest) => <option key={guest.id} value={guest.id}>{guest.name}</option>)}</select><button className="button button--small button--primary" onClick={() => replaceInvite(declined)} disabled={!replacementId}>Criar convite</button></div>}
              </div>}
            </div>
          </li>
        })}</ul>}
    </section>
  </>
}

function duration(start: string, end: string) { return Math.max(0, (Number(end.slice(0, 2)) * 60 + Number(end.slice(3)) - Number(start.slice(0, 2)) * 60 - Number(start.slice(3)))) }
function modalityLabel(value: DefenseBoard['modality']) { return value === 'online' ? 'Online' : value === 'hibrida' ? 'Híbrida' : 'Presencial' }
function inviteLabel(status: Invitation['status']) { return status === 'aceito' ? 'aceitou' : status === 'recusado' ? 'recusou' : status === 'expirado' ? 'expirou' : 'aguarda' }
/** Dica de disponibilidade do docente na data escolhida, para evitar o conflito antes de salvar. */
function availabilityNote(userId: string, date: string, availabilities: Availability[]) {
  if (!date) return ''
  const slots = availabilities.filter((slot) => slot.userId === userId && slot.date === date)
  const shortDate = `${date.slice(8, 10)}/${date.slice(5, 7)}`
  return slots.length ? `Livre ${slots.map((slot) => `${slot.start}–${slot.end}`).join(', ')} em ${shortDate}` : `Sem disponibilidade em ${shortDate}`
}
