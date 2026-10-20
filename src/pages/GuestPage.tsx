import { useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle, ArrowRight, CalendarDays, Check, Clock3, Link2, Mail, MapPin, ShieldCheck, Users, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { validateInvitation } from '../domain/rules'
import type { Invitation } from '../domain/types'
import type { PageProps } from '../App'
import './GuestPage.css'

export function GuestPage({ state, setState, viewer, notify }: PageProps) {
  const initialToken = new URLSearchParams(window.location.search).get('convite') ?? ''
  const [token, setToken] = useState(initialToken)
  const [tokenInput, setTokenInput] = useState(initialToken)
  const [tokenError, setTokenError] = useState('')
  const [responded, setResponded] = useState(false)
  const activeInvite = state.invitations.find((invite) => invite.token === token)
  const validation = token ? validateInvitation(activeInvite) : null
  const invitationBoard = activeInvite && state.boards.find((board) => board.id === activeInvite.boardId)
  const invitationWork = invitationBoard && state.works.find((work) => work.id === invitationBoard.workId)
  const invitee = activeInvite && state.users.find((user) => user.id === activeInvite.inviteeId)
  const myInvitations = state.invitations.filter((invite) => invite.inviteeId === viewer.id).sort((a, b) => b.sentAt.localeCompare(a.sentAt))

  function openToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = tokenInput.trim()
    if (!value) { setTokenError('Informe o token que aparece no link demonstrativo.'); return }
    window.history.pushState({}, '', `?convite=${encodeURIComponent(value)}`)
    setToken(value)
    setTokenError('')
    setResponded(false)
  }

  function openInvitation(invitation: Invitation) {
    setTokenInput(invitation.token)
    setToken(invitation.token)
    setTokenError('')
    setResponded(false)
    window.history.pushState({}, '', `?convite=${encodeURIComponent(invitation.token)}`)
  }

  function respond(answer: 'aceito' | 'recusado') {
    if (!activeInvite || !validation?.ok) return
    const decision = answer === 'aceito' ? 'aceitar a participação' : 'recusar a participação'
    if (!window.confirm(`Confirmar que deseja ${decision}? O token ficará utilizado após a resposta.`)) return
    const now = new Date().toISOString()
    setState((current) => ({
      ...current,
      invitations: current.invitations.map((invite) => invite.id === activeInvite.id ? { ...invite, status: answer, usedAt: now } : invite),
      history: [...current.history, { id: `h-${Date.now().toString(36)}`, boardId: activeInvite.boardId, at: now, actorId: activeInvite.inviteeId, label: answer === 'aceito' ? 'Participação aceita' : 'Participação recusada', detail: 'Resposta registrada pelo token individual demonstrativo.' }],
    }))
    setResponded(true)
    notify({ kind: 'success', message: answer === 'aceito' ? 'Participação aceita neste cenário demonstrativo.' : 'Recusa registrada neste cenário demonstrativo.' })
  }

  const validationReason = validation && 'reason' in validation ? validation.reason : undefined
  const errorMessage = !token ? '' : !activeInvite ? 'Este token não existe. Confira o link ou selecione um convite listado abaixo.'
    : validationReason === 'expirado' ? 'Este convite expirou. Peça ao orientador que gere um novo convite.'
      : validationReason === 'utilizado' || validationReason === 'respondido' ? 'Este token já foi utilizado. Não é possível responder novamente.' : ''
  const alreadyResponded = activeInvite?.status === 'aceito' || activeInvite?.status === 'recusado'

  return <>
    <PageHeader title="Convite para participar da banca" description="Acesse pelo link individual e registre uma única resposta." />
    {!token && <section className="panel invite-access-panel">
      <div className="invite-access-copy"><span className="invite-access-icon"><Mail size={20} /></span><div><h2>Convites de demonstração</h2><p>Escolha um convite da sua lista ou cole o token para simular o acesso por link.</p></div></div>
      <form className="token-form" onSubmit={openToken}><label htmlFor="token-field">Token do convite</label><div><input id="token-field" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} placeholder="Ex.: demo-marcos-033" /><button className="button button--primary" type="submit">Acessar <ArrowRight size={15} /></button></div>{tokenError && <span className="form-error" role="alert">{tokenError}</span>}</form>
    </section>}
    {!token && <section className="panel invite-list-panel"><div className="panel-heading"><div><h2>Convites disponíveis</h2><p>Perfil atual: {viewer.name}</p></div><span className="simulation-tag"><ShieldCheck size={14} /> Token demonstrativo</span></div>
      {myInvitations.length === 0 ? <div className="empty-state"><span><Mail size={18} /></span><div><strong>Nenhum convite ligado a este perfil</strong><p>Use o token de um convite demonstrativo para abrir os detalhes.</p></div></div> : myInvitations.map((invite) => {
        const board = state.boards.find((item) => item.id === invite.boardId)!
        const work = state.works.find((item) => item.id === board.workId)!
        return <div className="invite-list-row" key={invite.id}><div><strong>{work.title}</strong><span>{formatDate(board.date)} · {board.start} · {board.location}</span></div><StatusBadge status={invite.status} /><button className="button button--small" onClick={() => openInvitation(invite)}>Abrir convite <ArrowRight size={14} /></button></div>
      })}
    </section>}
    {token && errorMessage && !alreadyResponded && <section className="token-error-panel" role="alert"><AlertCircle size={21} /><div><strong>Não é possível responder</strong><p>{errorMessage}</p><button className="text-button" onClick={() => { setToken(''); setTokenInput(''); setTokenError(''); window.history.pushState({}, '', window.location.pathname) }}>Ver meus convites <ArrowRight size={14} /></button></div></section>}
    {token && activeInvite && validation?.ok && invitationBoard && invitationWork && invitee && <section className="invite-detail-layout">
      <article className="panel invite-detail-main">
        <div className="invite-detail-top"><span className="invite-status-icon"><Mail size={19} /></span><div><span className="small-label">CONVITE INDIVIDUAL</span><h2>Participação em banca de TCC</h2><p>Olá, {invitee.name}. Confira os dados antes de responder.</p></div><StatusBadge status={activeInvite.status} /></div>
        <div className="invite-work-title"><span>Trabalho</span><strong>{invitationWork.title}</strong><small>{state.courses.find((course) => course.id === invitationWork.courseId)?.name}</small></div>
        <div className="invite-facts">
          <div><CalendarDays size={17} /><span><small>Data</small><strong>{formatDate(invitationBoard.date)}</strong></span></div>
          <div><Clock3 size={17} /><span><small>Horário</small><strong>{invitationBoard.start}–{invitationBoard.end}</strong></span></div>
          <div><MapPin size={17} /><span><small>Modalidade e local</small><strong>{modality(invitationBoard.modality)} · {invitationBoard.location}</strong></span></div>
          <div><Users size={17} /><span><small>Orientador(a)</small><strong>{state.users.find((user) => user.id === invitationWork.advisorId)?.name}</strong></span></div>
        </div>
        <div className="invite-people"><div><span>Discente(s)</span><strong>{invitationWork.authorIds.map((id) => state.users.find((user) => user.id === id)?.name).filter(Boolean).join(' e ')}</strong></div><div><span>Seu vínculo</span><strong>{invitee.name} · docente convidado</strong></div></div>
        <div className="invite-actions-note"><ShieldCheck size={16} /><span>Esta resposta registra somente o aceite ou a recusa do convite. Ela não substitui assinatura na ata.</span></div>
        {!responded && <div className="invite-actions"><button className="button button--primary" onClick={() => respond('aceito')}><Check size={16} /> Aceitar participação</button><button className="button button--danger" onClick={() => respond('recusado')}><X size={16} /> Recusar convite</button></div>}
      </article>
      <aside className="invite-detail-aside"><div className="invite-aside-head"><span><Link2 size={16} /></span><strong>Acesso por token</strong></div><p>O link funciona uma vez e até o prazo informado.</p><dl><div><dt>Validade</dt><dd>{new Date(activeInvite.expiresAt).toLocaleDateString('pt-BR')}</dd></div><div><dt>Token</dt><dd className="token-masked">{activeInvite.token.slice(0, 8)}••••</dd></div></dl><div className="invite-safe-note"><Clock3 size={15} /> Resposta única · link demonstrativo</div></aside>
    </section>}
    {token && activeInvite && alreadyResponded && <section className="token-error-panel token-error-panel--success" role="status"><Check size={21} /><div><strong>Resposta já registrada</strong><p>Este convite foi {activeInvite.status === 'aceito' ? 'aceito' : 'recusado'} em {activeInvite.usedAt ? new Date(activeInvite.usedAt).toLocaleString('pt-BR') : 'uma resposta anterior'}. O token não pode ser reutilizado.</p></div></section>}
  </>
}

function formatDate(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
function modality(value: string) { return value === 'online' ? 'Online' : value === 'hibrida' ? 'Híbrida' : 'Presencial' }
