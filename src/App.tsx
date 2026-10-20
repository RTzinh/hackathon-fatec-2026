import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import {
  AlertCircle, ArrowRight, BookOpenCheck, CalendarDays, CheckCircle2,
  ClipboardCheck, FileCheck2, FileText, GraduationCap, Info, LayoutDashboard, Library,
  LogOut, Mail, Menu, Network, Plus, RotateCcw, Search, Send, Undo2, X,
} from 'lucide-react'
import { BrandImage } from './components/BrandImage'
import { PageHeader } from './components/PageHeader'
import { ProfileTabs } from './components/ProfileTabs'
import type { DemoProfile } from './components/ProfileTabs'
import { StatusBadge } from './components/StatusBadge'
import { demoState } from './data/demo-data'
import { LoginPage } from './pages/LoginPage'
import type { NewAccount } from './pages/LoginPage'
import { SchedulePage } from './pages/SchedulePage'
import { GuestPage } from './pages/GuestPage'
import { StudentPage } from './pages/StudentPage'
import { PostDefensePage } from './pages/PostDefensePage'
import { ConsultationPage } from './pages/ConsultationPage'
import { CoordinationPage } from './pages/CoordinationPage'
import { LibraryPage } from './pages/LibraryPage'
import { ProcessModelPage } from './pages/ProcessModelPage'
import { DEMO_STORAGE_KEY, loadDemoState, parseDemoState, resetDemoState, saveDemoState } from './repositories/demo-storage'
import type { DemoState, ProfileRole, User } from './domain/types'
import './App.css'

export type View = 'overview' | 'schedule' | 'post-defense' | 'guest' | 'student' | 'consultation' | 'coordination' | 'library' | 'outbox' | 'model'
/** `undo: true` mostra "Desfazer", que restaura o estado anterior à última ação. */
export type Toast = { kind: 'success' | 'error' | 'info'; message: string; undo?: boolean }
export interface PageProps {
  state: DemoState
  setState: Dispatch<SetStateAction<DemoState>>
  viewer: User
  navigate: (view: View, focus?: string) => void
  notify: (toast: Toast) => void
  /** Banca que a tela deve abrir já selecionada, quando a navegação veio de um atalho. */
  focus?: string
}

// As quatro jornadas pedidas no tema: orientador, convidado, aluno e consulta pública/coordenação.
// `param` é o valor de `?perfil=` que abre a aba direto nesse perfil (útil na apresentação: uma aba por perfil).
const profiles: Array<DemoProfile & { param: string }> = [
  { id: 'u-camila', role: 'orientador', label: 'Orientador', name: 'Camila Nunes', param: 'orientador' },
  { id: 'u-marcos', role: 'convidado', label: 'Convidado', name: 'Marcos Reis', param: 'convidado' },
  { id: 'u-davi', role: 'aluno', label: 'Aluno', name: 'Davi Rocha', param: 'aluno' },
  { id: 'u-eva', role: 'coordenacao', label: 'Coordenação', name: 'Eva Ribeiro', param: 'coordenacao' },
]
const roleLabels: Record<ProfileRole, string> = { orientador: 'Orientador', convidado: 'Convidado', aluno: 'Aluno', coordenacao: 'Coordenação', bibliotecario: 'Bibliotecário', publico: 'Visitante' }
const signupRoles: NewAccount['role'][] = ['orientador', 'convidado', 'aluno', 'coordenacao']

// O perfil vive no sessionStorage (um por aba); os DADOS ficam no localStorage e são compartilhados.
const PROFILE_KEY = 'sig-banca-profile'

const homeView: Record<ProfileRole, View> = { orientador: 'overview', convidado: 'guest', aluno: 'student', coordenacao: 'coordination', bibliotecario: 'library', publico: 'consultation' }
const modelView = { id: 'model' as const, label: 'Modelo do processo', icon: Network }
const consultationView = { id: 'consultation' as const, label: 'Consulta pública', icon: Search }
const roleViews: Record<ProfileRole, Array<{ id: View; label: string; icon: typeof CalendarDays }>> = {
  orientador: [
    { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
    { id: 'schedule', label: 'Agenda e bancas', icon: CalendarDays },
    { id: 'post-defense', label: 'Pós-banca', icon: FileCheck2 },
    { id: 'outbox', label: 'Caixa de saída', icon: Mail },
  ],
  convidado: [{ id: 'guest', label: 'Meus convites', icon: Mail }],
  aluno: [{ id: 'student', label: 'Meu trabalho', icon: GraduationCap }],
  coordenacao: [{ id: 'coordination', label: 'Pendências', icon: ClipboardCheck }, { id: 'library', label: 'Depósito RIC-CPS', icon: Library }],
  bibliotecario: [{ id: 'library', label: 'Fila da biblioteca', icon: Library }],
  publico: [],
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

/** Perfil inicial da aba: `?perfil=` na URL vence; senão o que esta aba já escolheu; senão nenhum (tela de login). */
function initialProfileId(): string | null {
  const param = new URLSearchParams(window.location.search).get('perfil')
  const fromUrl = profiles.find((profile) => profile.param === param)
  if (fromUrl) return fromUrl.id
  try { const saved = sessionStorage.getItem(PROFILE_KEY); if (saved) return saved } catch { /* sessionStorage bloqueado: a aba pede login */ }
  // Link de convite sem perfil: abre como o convidado de teste.
  return new URLSearchParams(window.location.search).has('convite') ? 'u-marcos' : null
}

function profileOf(user: User): DemoProfile {
  return { id: user.id, role: user.role, label: roleLabels[user.role], name: user.name }
}

export default function App() {
  const [state, setRawState] = useState<DemoState>(() => loadDemoState())
  // null = esta aba ainda não entrou (mostra o login).
  const [profileId, setProfileId] = useState<string | null>(initialProfileId)
  const [view, setView] = useState<View>(() => {
    if (new URLSearchParams(window.location.search).has('convite')) return 'guest'
    const role = state.users.find((user) => user.id === profileId)?.role
    return role ? homeView[role] : 'overview'
  })
  const [focus, setFocus] = useState<string>()
  const [toast, setToast] = useState<Toast | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [storageError, setStorageError] = useState(false)
  // O usuário vem do estado (não da lista fixa), então contas criadas no login também funcionam.
  const viewer = useMemo(() => state.users.find((user) => user.id === profileId) ?? null, [state.users, profileId])
  const committed = useRef(state)
  const undoSnapshot = useRef<DemoState | null>(null)
  const actionOpen = useRef(false)
  const syncNoticeShown = useRef(false)

  // Cada ação do usuário pode chamar setState várias vezes; o instantâneo guarda o estado anterior à primeira chamada.
  const setState = useCallback<Dispatch<SetStateAction<DemoState>>>((action) => {
    if (!actionOpen.current) {
      undoSnapshot.current = committed.current
      actionOpen.current = true
      window.setTimeout(() => { actionOpen.current = false }, 0)
    }
    setRawState(action)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setIsReady(true), 220)
    return () => window.clearTimeout(timer)
  }, [])
  useEffect(() => {
    committed.current = state
    try { saveDemoState(state); setStorageError(false) } catch { setStorageError(true) }
  }, [state])
  // Outra aba gravou os dados: recarrega aqui sem criar "Desfazer". O efeito acima só grava se o JSON mudou,
  // então esta aba não devolve o mesmo valor e não há laço entre abas.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.storageArea !== window.localStorage || (event.key !== null && event.key !== DEMO_STORAGE_KEY)) return
      undoSnapshot.current = null
      setRawState(parseDemoState(event.key === null ? null : event.newValue))
      if (!syncNoticeShown.current) { syncNoticeShown.current = true; setToast({ kind: 'info', message: 'Atualizado por outra aba' }) }
      else setToast((current) => current?.undo ? null : current)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  // Perfil da aba: sessionStorage (por aba) e ?perfil= na URL, para recarregar a aba no mesmo perfil.
  useEffect(() => {
    try { if (profileId) sessionStorage.setItem(PROFILE_KEY, profileId); else sessionStorage.removeItem(PROFILE_KEY) } catch { /* a URL ainda guarda o perfil */ }
    const param = profiles.find((profile) => profile.id === profileId)?.param
    const url = new URL(window.location.href)
    if (param) url.searchParams.set('perfil', param); else url.searchParams.delete('perfil')
    if (url.href !== window.location.href) window.history.replaceState({}, '', url)
  }, [profileId])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), toast.undo ? 7000 : 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  function navigate(nextView: View, nextFocus?: string) {
    setView(nextView)
    setFocus(nextFocus)
    setMobileNavOpen(false)
    window.scrollTo({ top: 0 })
    if (nextView !== 'guest') {
      const url = new URL(window.location.href)
      url.searchParams.delete('convite')
      window.history.replaceState({}, '', url)
    }
  }
  function enterAs(user: User) {
    setProfileId(user.id)
    navigate(homeView[user.role])
  }
  function changeProfile(nextId: string) {
    const next = state.users.find((user) => user.id === nextId)
    if (next) enterAs(next)
  }
  function createAccount({ name, email, role }: NewAccount) {
    if (state.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) return 'Já existe uma conta de teste com este e-mail. Entre por ela na lista.'
    const user: User = { id: `u-${Date.now().toString(36)}`, name, email, role, initials: initials(name) }
    setState((current) => ({ ...current, users: [...current.users, user] }))
    enterAs(user)
  }
  function logout() {
    setProfileId(null)
    setView('overview')
    setFocus(undefined)
    setMobileNavOpen(false)
    setToast(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('convite')
    window.history.replaceState({}, '', url)
  }
  function undo() {
    if (!undoSnapshot.current) return
    setRawState(undoSnapshot.current)
    undoSnapshot.current = null
    setToast({ kind: 'info', message: 'Ação desfeita.' })
  }
  function restoreDemo() {
    setState(resetDemoState())
    setProfileId('u-camila')
    navigate('overview')
    setToast({ kind: 'success', message: 'Cenário inicial restaurado.', undo: true })
  }

  if (!isReady) return <div className="loading-screen" role="status"><div className="brand-mark brand-mark--loading">I</div><span>Preparando a demonstração…</span></div>
  if (!viewer) return <LoginPage
    accounts={profiles.map(({ id, label, param }) => ({ user: state.users.find((user) => user.id === id) ?? demoState.users.find((user) => user.id === id)!, label, param }))}
    users={state.users}
    roles={signupRoles.map((role) => ({ role, label: roleLabels[role] }))}
    onEnter={(id) => changeProfile(id)}
    onCreate={createAccount}
  />
  const currentProfile = profileOf(viewer)
  // Os quatro perfis fixos sempre aparecem; uma conta criada ou digitada no login entra como quinta aba.
  const tabProfiles: DemoProfile[] = profiles.some((profile) => profile.id === viewer.id) ? profiles : [...profiles, { ...currentProfile, label: viewer.name.split(' ')[0] }]
  const pages = [...roleViews[currentProfile.role], consultationView, modelView]
  const activePage = pages.find((item) => item.id === view) ?? pages[0]
  const props: PageProps = { state, setState, viewer, navigate, notify: setToast, focus }
  const navButton = ({ id, label, icon: Icon }: (typeof pages)[number]) => <button key={id} className={`nav-link ${view === id ? 'nav-link--active' : ''}`} onClick={() => navigate(id)} aria-current={view === id ? 'page' : undefined}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{id === 'outbox' && <span className="nav-count">{state.invitations.filter((invite) => invite.status === 'pendente').length}</span>}</button>

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <aside className={`sidebar ${mobileNavOpen ? 'sidebar--open' : ''}`} aria-label="Navegação principal">
      <div className="brand-lockup"><BrandImage file="integrae-mark.png" className="brand-mark" fallback={<div className="brand-mark">I</div>} /><div><strong>Integrae</strong><span>Fatec Bauru</span></div><button className="icon-button sidebar-close" aria-label="Fechar menu" onClick={() => setMobileNavOpen(false)}><X size={18} /></button></div>
      <nav className="side-nav">
        {roleViews[currentProfile.role].map(navButton)}
        {roleViews[currentProfile.role].length > 0 && <div className="nav-divider" role="separator" />}
        {navButton(consultationView)}
        {navButton(modelView)}
      </nav>
      <div className="sidebar-bottom">
        <p className="sidebar-note">Dados fictícios. Nada é enviado para fora deste navegador.</p>
        <button className="sidebar-reset" onClick={restoreDemo}><RotateCcw size={14} /> Restaurar cenário inicial</button>
        <button className="sidebar-reset" onClick={logout}><LogOut size={14} /> Sair</button>
      </div>
    </aside>
    {mobileNavOpen && <button className="nav-scrim" aria-label="Fechar navegação" onClick={() => setMobileNavOpen(false)} />}
    <div className="main-column">
      <header className="topbar">
        <button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
        <div className="breadcrumbs"><span>Integrae</span><span className="breadcrumb-divider">/</span><strong>{activePage.label}</strong></div>
        <ProfileTabs profiles={tabProfiles} value={viewer.id} onChange={changeProfile} />
      </header>
      {storageError && <div className="storage-warning" role="alert"><AlertCircle size={17} /> O navegador bloqueou o armazenamento local. As alterações podem não sobreviver a uma recarga.</div>}
      <main id="main-content" className="main-content" key={`${view}-${focus ?? ''}`}>
        {view === 'overview' && <OverviewPage {...props} />}
        {view === 'schedule' && <SchedulePage {...props} />}
        {view === 'post-defense' && <PostDefensePage {...props} />}
        {view === 'guest' && <GuestPage {...props} />}
        {view === 'student' && <StudentPage {...props} />}
        {view === 'consultation' && <ConsultationPage {...props} />}
        {view === 'coordination' && <CoordinationPage {...props} />}
        {view === 'library' && <LibraryPage {...props} />}
        {view === 'model' && <ProcessModelPage />}
        {view === 'outbox' && <OutboxPage state={state} navigate={navigate} />}
      </main>
    </div>
    {toast && <div className={`toast toast--${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
      <span className="toast__icon">{toast.kind === 'success' ? <CheckCircle2 size={18} /> : toast.kind === 'error' ? <AlertCircle size={18} /> : <Info size={18} />}</span>
      <span className="toast__message">{toast.message}</span>
      {toast.undo && <button className="toast__undo" onClick={undo}><Undo2 size={14} /> Desfazer</button>}
      <button className="toast__close" aria-label="Fechar aviso" onClick={() => setToast(null)}><X size={15} /></button>
    </div>}
  </div>
}

type ActionItem = { key: string; icon: typeof Mail; title: string; detail: string; view: View; focus?: string }

function OverviewPage({ state, navigate }: PageProps) {
  const titleOf = (workId: string) => state.works.find((work) => work.id === workId)?.title ?? ''
  const documentOf = (boardId: string, kind: 'ata' | 'autorizacao-ric-cps') => state.documents.find((document) => document.boardId === boardId && document.kind === kind)
  const pendingInvites = state.invitations.filter((invitation) => invitation.status === 'pendente')
  const actions: ActionItem[] = []
  if (pendingInvites.length) actions.push({ key: 'invites', icon: Mail, title: `${pendingInvites.length} convite(s) sem resposta`, detail: 'Acompanhe as respostas na caixa de saída', view: 'outbox' })
  for (const board of state.boards) {
    const title = titleOf(board.workId)
    const ata = documentOf(board.id, 'ata')
    const term = documentOf(board.id, 'autorizacao-ric-cps')
    const approved = state.versions.some((version) => version.workId === board.workId && version.status === 'aprovada')
    const deposit = state.deposits.find((item) => item.workId === board.workId)
    if (board.status === 'realizada' && ata?.status !== 'aprovado') actions.push({ key: `ata-${board.id}`, icon: FileText, title: 'Conferir a ata', detail: title, view: 'post-defense', focus: board.id })
    for (const version of state.versions.filter((item) => item.workId === board.workId && item.status === 'enviada')) actions.push({ key: version.id, icon: ClipboardCheck, title: `Avaliar a versão ${version.number}`, detail: title, view: 'post-defense', focus: board.id })
    if (board.status === 'pendente-correcao' && ata?.status === 'aprovado' && approved && term?.status !== 'aprovado') actions.push({ key: `ta-${board.id}`, icon: FileCheck2, title: 'Completar o Termo de Autorização', detail: title, view: 'post-defense', focus: board.id })
    if (board.status === 'concluida' && (!deposit || deposit.status === 'nao-encaminhado')) actions.push({ key: `dep-${board.id}`, icon: Send, title: 'Encaminhar à biblioteca', detail: title, view: 'post-defense', focus: board.id })
  }
  const nextBoards = [...state.boards].filter((board) => board.status !== 'concluida').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5)
  const total = state.works.length
  const boardOf = (workId: string) => state.boards.find((board) => board.workId === workId)
  const steps = [
    { label: 'Agendadas', complete: state.works.filter((work) => boardOf(work.id)).length },
    { label: 'Convite aceito', complete: state.works.filter((work) => state.invitations.some((invite) => invite.boardId === boardOf(work.id)?.id && invite.status === 'aceito')).length },
    { label: 'Ata conferida', complete: state.works.filter((work) => documentOf(boardOf(work.id)?.id ?? '', 'ata')?.status === 'aprovado').length },
    { label: 'Versão com aval', complete: state.works.filter((work) => state.versions.some((version) => version.workId === work.id && version.status === 'aprovada')).length },
    { label: 'TA validado', complete: state.works.filter((work) => documentOf(boardOf(work.id)?.id ?? '', 'autorizacao-ric-cps')?.status === 'aprovado').length },
    { label: 'No RIC-CPS', complete: state.deposits.filter((deposit) => deposit.status === 'registrado').length },
  ]
  const openDocuments = state.documents.filter((document) => state.boards.find((board) => board.id === document.boardId)?.status !== 'agendada' && document.status !== 'aprovado').length
  return <>
    <PageHeader title="Suas bancas" description="O que pede atenção agora e em que etapa cada trabalho está." actions={<button className="button button--primary" onClick={() => navigate('schedule')}><Plus size={17} /> Nova banca</button>} />
    <div className="overview-strip" aria-label="Resumo">
      <SummaryItem icon={<CalendarDays size={18} />} label="Agendadas" value={state.boards.filter((board) => board.status === 'agendada').length} accent="red" onClick={() => navigate('schedule')} />
      <SummaryItem icon={<Mail size={18} />} label="Convites sem resposta" value={pendingInvites.length} accent="amber" onClick={() => navigate('outbox')} />
      <SummaryItem icon={<ClipboardCheck size={18} />} label="Em correção" value={state.boards.filter((board) => board.status === 'pendente-correcao').length} accent="blue" onClick={() => navigate('post-defense')} />
      <SummaryItem icon={<FileText size={18} />} label="Documentos em aberto" value={openDocuments} accent="green" onClick={() => navigate('post-defense')} />
    </div>
    <div className="dashboard-grid">
      <section className="panel panel--priority" aria-labelledby="priorities-heading">
        <div className="panel-heading"><div><h2 id="priorities-heading">Para fazer agora</h2><p>{actions.length ? `${actions.length} ação(ões) destravam o fluxo` : 'Nada pendente'}</p></div></div>
        {actions.length ? <ul className="action-list">{actions.slice(0, 6).map(({ key, icon: Icon, title, detail, view, focus }) => <li key={key}><button onClick={() => navigate(view, focus)}><span className="action-list__icon"><Icon size={16} /></span><span className="action-list__text"><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={15} className="action-list__arrow" /></button></li>)}</ul>
          : <EmptyState title="Tudo em dia" detail="Novas pendências aparecem aqui automaticamente." />}
      </section>
      <section className="panel panel--agenda" aria-labelledby="next-bancas-heading">
        <div className="panel-heading"><div><h2 id="next-bancas-heading">Próximas bancas</h2><p>Em andamento, por data</p></div><button className="text-button" onClick={() => navigate('schedule')}>Ver agenda <ArrowRight size={15} /></button></div>
        <div className="agenda-list">
          {nextBoards.length === 0 ? <EmptyState title="Nenhuma banca em andamento" detail="Cadastre uma banca para acompanhar as próximas etapas." /> : nextBoards.map((board) => {
            const work = state.works.find((item) => item.id === board.workId)!
            const course = state.courses.find((item) => item.id === work.courseId)!
            const authors = work.authorIds.map((id) => state.users.find((user) => user.id === id)?.name).filter(Boolean).join(' e ')
            const date = new Date(`${board.date}T12:00:00`)
            return <button className="agenda-row" key={board.id} onClick={() => navigate(board.status === 'agendada' ? 'schedule' : 'post-defense', board.status === 'agendada' ? undefined : board.id)}>
              <span className="agenda-date"><strong>{String(date.getDate()).padStart(2, '0')}</strong><small>{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small></span>
              <span className="agenda-details"><strong>{work.title}</strong><span>{authors} · {course.code} · {board.start}</span></span>
              <StatusBadge status={board.status} />
            </button>
          })}
        </div>
      </section>
    </div>
    <section className="panel panel--flow" aria-labelledby="flow-heading">
      <div className="panel-heading"><div><h2 id="flow-heading">Trilha do trabalho</h2><p>{total} trabalhos, da agenda ao depósito</p></div><button className="text-button" onClick={() => navigate('model')}>Como funciona <ArrowRight size={15} /></button></div>
      <ol className="workflow-track" aria-label="Etapas do ciclo da banca">
        {steps.map(({ label, complete }, index) => <li className="workflow-step" key={label}>
          <span className="workflow-step__index">{index + 1}</span><div className="workflow-step__body"><strong>{label}</strong><span>{complete} de {total}</span><div className="workflow-bar" aria-hidden="true"><span style={{ width: `${(complete / total) * 100}%` }} /></div></div>
        </li>)}
      </ol>
    </section>
  </>
}

function SummaryItem({ icon, label, value, accent, onClick }: { icon: ReactNode; label: string; value: number; accent: string; onClick: () => void }) {
  return <button className={`summary-item summary-item--${accent}`} onClick={onClick}><span className="summary-item__icon">{icon}</span><span className="summary-item__label">{label}</span><strong>{value}</strong></button>
}

function OutboxPage({ state, navigate }: { state: DemoState; navigate: (view: View) => void }) {
  return <><PageHeader title="Caixa de saída" description="Convites preparados para os docentes. Abra o link para responder como o convidado." actions={<span className="simulation-tag"><Mail size={14} /> Envio simulado</span>} />
    <section className="panel table-panel">
      <div className="table-scroll"><table><thead><tr><th>Docente</th><th>Trabalho</th><th>Banca</th><th>Situação</th><th aria-label="Ação" /></tr></thead><tbody>
        {[...state.outbox].reverse().map((message) => {
          const invite = state.invitations.find((item) => item.id === message.invitationId)!
          const board = state.boards.find((item) => item.id === invite.boardId)!
          const work = state.works.find((item) => item.id === board.workId)!
          const invitee = state.users.find((item) => item.id === invite.inviteeId)!
          return <tr key={message.id}><td><strong>{invitee.name}</strong><small>{invitee.email}</small></td><td>{work.title}</td><td>{new Date(`${board.date}T12:00:00`).toLocaleDateString('pt-BR')}<small>{board.start}</small></td><td><StatusBadge status={invite.status} /></td><td className="cell-action"><button className="button button--small" onClick={() => { window.history.pushState({}, '', `?convite=${invite.token}`); navigate('guest') }}>Abrir convite <ArrowRight size={13} /></button></td></tr>
        })}
      </tbody></table></div>
    </section></>
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><span><BookOpenCheck size={18} /></span><div><strong>{title}</strong><p>{detail}</p></div></div>
}
