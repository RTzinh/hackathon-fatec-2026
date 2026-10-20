import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertTriangle, CalendarDays, Check, Clock3, Mail, Plus, Users, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { detectConflicts, suggestAlternativeSlots } from '../domain/rules'
import type { DefenseBoard, Invitation } from '../domain/types'
import type { PageProps } from '../App'
import './SchedulePage.css'

type Draft = {
  title: string; courseId: string; authorIds: string[]; advisorId: string; evaluatorIds: string[]
  date: string; start: string; end: string; modality: 'presencial' | 'online' | 'hibrida'; location: string
}

const initialDraft = (advisorId: string): Draft => ({
  title: '', courseId: '', authorIds: [], advisorId, evaluatorIds: [],
  date: '2026-10-23', start: '14:00', end: '15:30', modality: 'presencial', location: '',
})

export function SchedulePage({ state, setState, viewer, notify }: PageProps) {
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => initialDraft(viewer.id))
  const [formError, setFormError] = useState('')
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
  const orderedBoards = [...state.boards].sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))

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
    if (conflicts.length && !window.confirm(`Há ${conflicts.length} conflito(s) no horário. Deseja manter a data e registrar a banca para revisão humana?`)) return

    const suffix = Date.now().toString(36)
    const workId = `w-${suffix}`
    const boardId = `b-${suffix}`
    const now = new Date().toISOString()
    const newWork = { id: workId, title: draft.title.trim(), courseId: draft.courseId, advisorId: draft.advisorId, authorIds: draft.authorIds, workType: 'Trabalho de graduação', hasProduct: false, updatedAt: now }
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
    setDraft(initialDraft(viewer.id))
    setShowForm(false)
    notify({ kind: 'success', message: `Banca cadastrada. ${invites.length} convite(s) demonstrativo(s) criado(s).` })
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
    notify({ kind: 'success', message: `Convite demonstrativo criado para ${replacement.name}.` })
  }

  return <>
    <PageHeader title="Agenda e bancas" description="Cadastre trabalhos, forme a banca e acompanhe as confirmações." actions={<button className="button button--primary" onClick={() => setShowForm((visible) => !visible)}>{showForm ? <X size={16} /> : <Plus size={16} />}{showForm ? 'Fechar cadastro' : 'Cadastrar banca'}</button>} />
    {showForm && <section className="panel form-panel" aria-labelledby="new-board-title">
      <div className="panel-heading"><div><h2 id="new-board-title">Nova banca de TCC</h2><p>Convites entram na caixa de saída demonstrativa após salvar.</p></div><span className="simulation-tag"><Mail size={14} /> E-mail simulado</span></div>
      <form className="form-body" onSubmit={submit}>
        <fieldset className="form-section"><legend>Trabalho e autoria</legend><div className="form-grid">
          <label className="field field--wide"><span>Título do trabalho <b>*</b></span><input autoComplete="off" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ex.: Plataforma de apoio à pesquisa aplicada" /></label>
          <label className="field"><span>Curso <b>*</b></span><select value={draft.courseId} onChange={(event) => setDraft({ ...draft, courseId: event.target.value })}><option value="">Selecione um curso</option>{state.courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}</select></label>
          <label className="field"><span>Orientador <b>*</b></span><select value={draft.advisorId} onChange={(event) => setDraft({ ...draft, advisorId: event.target.value })}>{advisors.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisor.name}</option>)}</select></label>
          <div className="field field--wide"><span>Aluno(s) <b>*</b></span><div className="choice-grid">{students.map((student) => <label className="choice" key={student.id}><input type="checkbox" checked={draft.authorIds.includes(student.id)} onChange={() => toggleDraftId('authorIds', student.id)} /><span>{student.name}</span></label>)}</div></div>
        </div></fieldset>
        <fieldset className="form-section"><legend>Data e local</legend><div className="form-grid">
          <label className="field"><span>Data <b>*</b></span><input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
          <div className="field field--time"><label><span>Início <b>*</b></span><input type="time" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} /></label><label><span>Término <b>*</b></span><input type="time" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} /></label></div>
          <label className="field"><span>Modalidade <b>*</b></span><select value={draft.modality} onChange={(event) => setDraft({ ...draft, modality: event.target.value as Draft['modality'] })}><option value="presencial">Presencial</option><option value="online">Online</option><option value="hibrida">Híbrida</option></select></label>
          <label className="field"><span>{draft.modality === 'presencial' ? 'Sala / local' : 'Local ou link'} <b>*</b></span><input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder={draft.modality === 'presencial' ? 'Ex.: Sala B-203' : 'Ex.: sala ou endereço da reunião'} /></label>
        </div></fieldset>
        <fieldset className="form-section"><legend>Avaliadores convidados</legend><div className="choice-grid">{guests.map((guest) => <label className="choice" key={guest.id}><input type="checkbox" checked={draft.evaluatorIds.includes(guest.id)} onChange={() => toggleDraftId('evaluatorIds', guest.id)} /><span>{guest.name}<small>{guest.email}</small></span></label>)}</div><p className="field-note">A demonstração não presume composição mínima ou regra de confirmação da banca.</p></fieldset>
        {conflicts.length > 0 && <div className="conflict-box" role="alert"><div className="conflict-box__heading"><AlertTriangle size={18} /><div><strong>Conflito de agenda encontrado</strong><span>{conflicts.join(' · ')}</span></div></div>{alternatives.length > 0 && <div className="alternative-row"><span>Sugestões disponíveis:</span>{alternatives.map((slot) => <button type="button" className="button button--small" key={`${slot.start}-${slot.end}`} onClick={() => setDraft({ ...draft, start: slot.start, end: slot.end })}><Clock3 size={14} /> {slot.start}–{slot.end}</button>)}</div>}<p>Você pode revisar o horário ou registrar mesmo assim para avaliação humana.</p></div>}
        {formError && <div className="form-error" role="alert">{formError}</div>}
        <div className="form-actions"><span><b>*</b> Campos obrigatórios · Sem assinatura digital nesta demonstração</span><button className="button button--primary" type="submit"><Check size={16} /> Salvar e preparar convites</button></div>
      </form>
    </section>}
    <section className="panel schedule-list-panel"><div className="panel-heading"><div><h2>Bancas cadastradas</h2><p>Os estados de banca e de convite são acompanhados separadamente.</p></div><span className="flow-caption"><CalendarDays size={14} /> {state.boards.length} registros fictícios</span></div>
      <div className="board-list">{orderedBoards.map((board) => {
        const work = state.works.find((item) => item.id === board.workId)!
        const course = state.courses.find((item) => item.id === work.courseId)!
        const advisor = state.users.find((item) => item.id === work.advisorId)!
        const boardInvitations = state.invitations.filter((invite) => invite.boardId === board.id)
        return <article className="board-list-row" key={board.id}>
          <div className="board-list-row__date"><strong>{formatDate(board.date)}</strong><span>{board.start}–{board.end}</span></div>
          <div className="board-list-row__main"><strong>{work.title}</strong><span>{course.code} · {work.authorIds.map((id) => state.users.find((user) => user.id === id)?.name).filter(Boolean).join(', ')}</span><small>{board.modality === 'online' ? 'Online' : board.modality === 'hibrida' ? 'Híbrida' : 'Presencial'} · {board.location} · Orientador: {advisor.name}</small></div>
          <div className="board-list-row__status"><StatusBadge status={board.status} /><div className="invite-summary">{boardInvitations.map((invite) => <span key={invite.id} title={state.users.find((user) => user.id === invite.inviteeId)?.name}><span className={`invite-mini invite-mini--${invite.status}`} />{state.users.find((user) => user.id === invite.inviteeId)?.name.split(' ')[0]} · {statusLabel(invite.status)}</span>)}</div></div>
          {boardInvitations.some((invite) => invite.status === 'recusado') && <div className="replacement"><button className="text-button" onClick={() => setReplacementFor(replacementFor === board.id ? '' : board.id)}><Users size={14} /> Substituir convidado que recusou</button>{replacementFor === board.id && <div className="replacement-form"><label className="sr-only" htmlFor={`replacement-${board.id}`}>Escolher convidado substituto</label><select id={`replacement-${board.id}`} value={replacementId} onChange={(event) => setReplacementId(event.target.value)}><option value="">Selecionar docente</option>{guests.filter((guest) => !boardInvitations.some((invite) => invite.inviteeId === guest.id && invite.status !== 'recusado')).map((guest) => <option key={guest.id} value={guest.id}>{guest.name}</option>)}</select><button className="button button--small button--primary" onClick={() => replaceInvite(boardInvitations.find((invite) => invite.status === 'recusado')!)} disabled={!replacementId}>Criar convite</button></div>}</div>}
        </article>
      })}</div>
    </section>
  </>
}

function duration(start: string, end: string) { return Math.max(0, (Number(end.slice(0, 2)) * 60 + Number(end.slice(3)) - Number(start.slice(0, 2)) * 60 - Number(start.slice(3)))) }
function formatDate(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '') }
function statusLabel(status: Invitation['status']) { return status === 'aceito' ? 'aceitou' : status === 'recusado' ? 'recusou' : status === 'expirado' ? 'expirou' : 'aguarda' }
