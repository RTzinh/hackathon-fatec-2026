import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, Check, Mail, ShieldCheck, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { validateInvitation } from '../domain/rules'
import type { Invitation } from '../domain/types'
import type { PageProps } from '../App'
import './GuestPage.css'

type Answer = 'aceito' | 'recusado'

export function GuestPage({ state, setState, viewer, notify }: PageProps) {
  const initialToken = new URLSearchParams(window.location.search).get('convite') ?? ''
  const [token, setToken] = useState(initialToken)
  const [tokenInput, setTokenInput] = useState(initialToken)
  const [tokenError, setTokenError] = useState('')
  const [pending, setPending] = useState<Answer | null>(null)
  const acceptRef = useRef<HTMLButtonElement>(null)
  const declineRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const doneRef = useRef<HTMLElement>(null)
  const lastChoice = useRef<Answer | null>(null)
  const activeInvite = state.invitations.find((invite) => invite.token === token)
  const validation = token ? validateInvitation(activeInvite) : null
  const invitationBoard = activeInvite && state.boards.find((board) => board.id === activeInvite.boardId)
  const invitationWork = invitationBoard && state.works.find((work) => work.id === invitationBoard.workId)
  const invitee = activeInvite && state.users.find((user) => user.id === activeInvite.inviteeId)
  const myInvitations = state.invitations.filter((invite) => invite.inviteeId === viewer.id).sort((a, b) => Number(b.status === 'pendente') - Number(a.status === 'pendente') || b.sentAt.localeCompare(a.sentAt))
  const alreadyResponded = activeInvite?.status === 'aceito' || activeInvite?.status === 'recusado'

  // A troca entre os botões e o resumo remove o elemento focado; devolve o foco para quem o perdeu.
  useEffect(() => {
    if (pending) { lastChoice.current = pending; confirmRef.current?.focus() }
    else if (lastChoice.current) { (lastChoice.current === 'aceito' ? acceptRef : declineRef).current?.focus(); lastChoice.current = null }
  }, [pending])
  useEffect(() => { if (alreadyResponded) doneRef.current?.focus() }, [alreadyResponded])

  function openToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = tokenInput.trim()
    if (!value) { setTokenError('Informe o token que aparece no link demonstrativo.'); return }
    window.history.pushState({}, '', `?convite=${encodeURIComponent(value)}`)
    setToken(value)
    setTokenError('')
    setPending(null)
  }

  function openInvitation(invitation: Invitation) {
    setTokenInput(invitation.token)
    setToken(invitation.token)
    setTokenError('')
    setPending(null)
    window.history.pushState({}, '', `?convite=${encodeURIComponent(invitation.token)}`)
  }

  function backToList() {
    setToken('')
    setTokenInput('')
    setTokenError('')
    setPending(null)
    window.history.pushState({}, '', window.location.pathname)
  }

  function respond() {
    if (!pending || !activeInvite || !validation?.ok) return
    const answer = pending
    const now = new Date().toISOString()
    setState((current) => ({
      ...current,
      invitations: current.invitations.map((invite) => invite.id === activeInvite.id ? { ...invite, status: answer, usedAt: now } : invite),
      history: [...current.history, { id: `h-${Date.now().toString(36)}`, boardId: activeInvite.boardId, at: now, actorId: activeInvite.inviteeId, label: answer === 'aceito' ? 'Participação aceita' : 'Participação recusada', detail: 'Resposta registrada pelo token individual demonstrativo.' }],
    }))
    setPending(null)
    // A resposta é formal e o token é de uso único: este aviso não oferece "Desfazer".
    notify({ kind: 'success', message: answer === 'aceito' ? 'Participação aceita neste cenário demonstrativo.' : 'Recusa registrada neste cenário demonstrativo.' })
  }

  const validationReason = validation && 'reason' in validation ? validation.reason : undefined
  const errorMessage = !token ? '' : !activeInvite ? 'Este token não existe. Confira o link ou selecione um convite listado abaixo.'
    : validationReason === 'expirado' ? 'Este convite expirou. Peça ao orientador que gere um novo convite.'
      : validationReason === 'utilizado' || validationReason === 'respondido' ? 'Este token já foi utilizado. Não é possível responder novamente.' : ''

  const tokenBlock = <section className="panel guest-token" aria-labelledby="token-title">
    <div className="guest-token__copy"><span className="guest-token__icon"><Mail size={18} /></span><div><h2 id="token-title">Acessar por token</h2><p>Cole o token do link recebido por e-mail.</p></div></div>
    <form className="token-form" onSubmit={openToken}>
      <label htmlFor="token-field">Token do convite</label>
      <div><input id="token-field" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} placeholder="Ex.: demo-marcos-033" autoComplete="off" /><button className="button button--primary" type="submit">Acessar <ArrowRight size={15} /></button></div>
      {tokenError && <span className="form-error" role="alert">{tokenError}</span>}
    </form>
  </section>

  const listBlock = <section className="panel guest-list" aria-labelledby="invites-title">
    <div className="panel-heading"><div><h2 id="invites-title">Convites disponíveis</h2><p>Perfil atual: {viewer.name}</p></div><span className="simulation-tag"><ShieldCheck size={14} /> Token demonstrativo</span></div>
    {myInvitations.length === 0 ? <div className="empty-state"><span><Mail size={18} /></span><div><strong>Nenhum convite ligado a este perfil</strong><p>Use o token de um convite demonstrativo para abrir os detalhes.</p></div></div>
      : <ul className="guest-list__items">{myInvitations.map((invite) => {
        const board = state.boards.find((item) => item.id === invite.boardId)!
        const work = state.works.find((item) => item.id === board.workId)!
        return <li className="guest-list__row" key={invite.id}>
          <div><strong>{work.title}</strong><span>{shortDate(board.date)} · {board.start} · {board.location}</span></div>
          <StatusBadge status={invite.status} />
          <button className={`button button--small ${invite.status === 'pendente' ? 'button--primary' : ''}`} onClick={() => openInvitation(invite)}>Abrir convite <ArrowRight size={14} /></button>
        </li>
      })}</ul>}
  </section>

  return <>
    <PageHeader title="Convite para participar da banca" description="Acesse pelo link individual e registre uma única resposta." />
    <div className="guest-stage">
      {!token && (myInvitations.length > 0 ? <>{listBlock}{tokenBlock}</> : <>{tokenBlock}{listBlock}</>)}

      {token && <button className="text-button guest-back" onClick={backToList}><ArrowLeft size={15} /> Voltar aos convites</button>}

      {token && errorMessage && !alreadyResponded && <section className="guest-notice guest-notice--error" role="alert">
        <AlertCircle size={21} />
        <div><strong>Não é possível responder</strong><p>{errorMessage}</p></div>
      </section>}

      {token && activeInvite && validation?.ok && invitationBoard && invitationWork && invitee && <article className="panel guest-card" aria-labelledby="guest-title">
        <header className="guest-card__head">
          <div>
            <span className="guest-card__eyebrow">Convite individual</span>
            <h2 id="guest-title">Participação em banca de TCC</h2>
            <p>Olá, {invitee.name}. Confira os dados antes de responder.</p>
          </div>
          <StatusBadge status={activeInvite.status}>Aguardando sua resposta</StatusBadge>
        </header>
        <div className="guest-card__work"><strong>{invitationWork.title}</strong><span>{state.courses.find((course) => course.id === invitationWork.courseId)?.name}</span></div>
        <dl className="guest-facts">
          <div><dt>Data</dt><dd>{longDate(invitationBoard.date)}</dd></div>
          <div><dt>Horário</dt><dd>{invitationBoard.start}–{invitationBoard.end}</dd></div>
          <div><dt>Local</dt><dd>{modality(invitationBoard.modality)} · {invitationBoard.location}</dd></div>
          <div><dt>Orientador(a)</dt><dd>{state.users.find((user) => user.id === invitationWork.advisorId)?.name}</dd></div>
          <div><dt>Discente(s)</dt><dd>{invitationWork.authorIds.map((id) => state.users.find((user) => user.id === id)?.name).filter(Boolean).join(' e ')}</dd></div>
        </dl>
        <div className="guest-decision">
          {pending === null
            ? <div className="guest-actions">
              <button ref={acceptRef} className="button button--primary guest-action" onClick={() => setPending('aceito')}><Check size={18} /> Aceitar participação</button>
              <button ref={declineRef} className="button button--danger guest-action" onClick={() => setPending('recusado')}><X size={18} /> Recusar convite</button>
            </div>
            : <div className={`guest-confirm guest-confirm--${pending}`} role="group" aria-label="Confirmar resposta">
              <p id="guest-confirm-text">Você vai {pending === 'aceito' ? 'aceitar a participação' : 'recusar o convite'}. O link deixa de valer depois da resposta.</p>
              <div className="guest-confirm__actions">
                <button ref={confirmRef} className={`button guest-action ${pending === 'aceito' ? 'button--primary' : 'button--danger guest-action--solid'}`} aria-describedby="guest-confirm-text" onClick={respond}>Confirmar</button>
                <button className="button guest-action" onClick={() => setPending(null)}>Voltar</button>
              </div>
            </div>}
        </div>
        <footer className="guest-card__foot">
          <span>Registra só o aceite ou a recusa; não substitui a assinatura na ata.</span>
          <span>Válido até {new Date(activeInvite.expiresAt).toLocaleDateString('pt-BR')} · resposta única</span>
        </footer>
      </article>}

      {token && activeInvite && alreadyResponded && <section ref={doneRef} tabIndex={-1} className="guest-notice guest-notice--done" role="status">
        <Check size={21} />
        <div><strong>Resposta já registrada</strong><p>Este convite foi {activeInvite.status === 'aceito' ? 'aceito' : 'recusado'} em {activeInvite.usedAt ? new Date(activeInvite.usedAt).toLocaleString('pt-BR') : 'uma resposta anterior'}. O token não pode ser reutilizado.</p></div>
      </section>}
    </div>
  </>
}

function longDate(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
function shortDate(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR') }
function modality(value: string) { return value === 'online' ? 'Online' : value === 'hibrida' ? 'Híbrida' : 'Presencial' }
