import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import {
  AlertCircle, ArrowRight, Bell, BookOpenCheck, CalendarDays, Check,
  CheckCircle2, ChevronDown, ClipboardCheck, Clock3, FileCheck2, FileText,
  GraduationCap, LayoutDashboard, Mail, Menu, Plus, RotateCcw, Search,
  Settings2, UsersRound, X,
} from 'lucide-react'
import { PageHeader } from './components/PageHeader'
import { StatusBadge } from './components/StatusBadge'
import { demoState } from './data/demo-data'
import { SchedulePage } from './pages/SchedulePage'
import { GuestPage } from './pages/GuestPage'
import { StudentPage } from './pages/StudentPage'
import { PostDefensePage } from './pages/PostDefensePage'
import { ConsultationPage } from './pages/ConsultationPage'
import { CoordinationPage } from './pages/CoordinationPage'
import { loadDemoState, resetDemoState, saveDemoState } from './repositories/demo-storage'
import type { DemoState, ProfileRole, User } from './domain/types'
import './App.css'

export type View = 'overview' | 'schedule' | 'post-defense' | 'guest' | 'student' | 'consultation' | 'coordination' | 'outbox'
export type Toast = { kind: 'success' | 'error' | 'info'; message: string }
export interface PageProps {
  state: DemoState
  setState: Dispatch<SetStateAction<DemoState>>
  viewer: User
  navigate: (view: View) => void
  notify: (toast: Toast) => void
}

const profiles: Array<{ id: string; role: ProfileRole; label: string; name: string }> = [
  { id: 'u-camila', role: 'orientador', label: 'Orientador', name: 'Camila Nunes' },
  { id: 'u-marcos', role: 'convidado', label: 'Docente convidado', name: 'Marcos Reis' },
  { id: 'u-davi', role: 'aluno', label: 'Aluno', name: 'Davi Rocha' },
  { id: 'u-eva', role: 'coordenacao', label: 'Coordenação', name: 'Eva Ribeiro' },
  { id: 'publico', role: 'publico', label: 'Consulta pública', name: 'Visitante' },
]

const roleViews: Record<ProfileRole, Array<{ id: View; label: string; icon: typeof CalendarDays }>> = {
  orientador: [
    { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
    { id: 'schedule', label: 'Agenda e bancas', icon: CalendarDays },
    { id: 'post-defense', label: 'Pós-banca e documentos', icon: FileCheck2 },
    { id: 'outbox', label: 'Caixa de saída', icon: Mail },
    { id: 'consultation', label: 'Consulta pública', icon: Search },
  ],
  convidado: [
    { id: 'guest', label: 'Meus convites', icon: Mail },
    { id: 'consultation', label: 'Consulta pública', icon: Search },
  ],
  aluno: [
    { id: 'student', label: 'Meu trabalho', icon: GraduationCap },
    { id: 'consultation', label: 'Consulta pública', icon: Search },
  ],
  coordenacao: [
    { id: 'coordination', label: 'Pendências', icon: ClipboardCheck },
    { id: 'consultation', label: 'Consulta pública', icon: Search },
  ],
  publico: [{ id: 'consultation', label: 'Consultar bancas', icon: Search }],
}

function resolveProfile(id: string): User {
  return demoState.users.find((user) => user.id === id) ?? { id: 'publico', name: 'Visitante', email: '', role: 'coordenacao', initials: 'VP' }
}

export default function App() {
  const [state, setState] = useState<DemoState>(() => loadDemoState())
  const [profileId, setProfileId] = useState(() => localStorage.getItem('sig-banca-profile') ?? 'u-camila')
  const [view, setView] = useState<View>(() => new URLSearchParams(window.location.search).has('convite') ? 'guest' : 'overview')
  const [toast, setToast] = useState<Toast | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const viewer = useMemo(() => resolveProfile(profileId), [profileId])
  const currentProfile = profiles.find((profile) => profile.id === profileId) ?? profiles[0]

  useEffect(() => {
    const timer = window.setTimeout(() => setIsReady(true), 220)
    return () => window.clearTimeout(timer)
  }, [])
  useEffect(() => {
    try { saveDemoState(state); setStorageError(false) } catch { setStorageError(true) }
  }, [state])
  useEffect(() => { try { localStorage.setItem('sig-banca-profile', profileId) } catch { setStorageError(true) } }, [profileId])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  function navigate(nextView: View) {
    setView(nextView)
    setMobileNavOpen(false)
    if (nextView !== 'guest') {
      const url = new URL(window.location.href)
      url.searchParams.delete('convite')
      window.history.replaceState({}, '', url)
    }
  }
  function changeProfile(nextId: string) {
    setProfileId(nextId)
    const next = profiles.find((profile) => profile.id === nextId)
    const nextView = next?.role === 'convidado' ? 'guest' : next?.role === 'aluno' ? 'student' : next?.role === 'coordenacao' ? 'coordination' : next?.role === 'publico' ? 'consultation' : 'overview'
    navigate(nextView)
  }
  function restoreDemo() {
    if (!window.confirm('Restaurar os dados fictícios iniciais? As alterações locais serão perdidas.')) return
    setState(resetDemoState())
    setProfileId('u-camila')
    setView('overview')
    setToast({ kind: 'success', message: 'Cenário inicial restaurado.' })
  }

  if (!isReady) return <div className="loading-screen" role="status"><div className="brand-mark brand-mark--loading">I</div><span>Preparando a demonstração…</span></div>
  const pages = roleViews[currentProfile.role]
  const activePage = pages.find((item) => item.id === view) ?? roleViews[viewer.role][0]
  const props: PageProps = { state, setState, viewer, navigate, notify: setToast }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <aside className={`sidebar ${mobileNavOpen ? 'sidebar--open' : ''}`} aria-label="Navegação principal">
      <div className="brand-lockup"><div className="brand-mark">I</div><div><strong>Integrae</strong><span>Fatec Bauru</span></div><button className="icon-button sidebar-close" aria-label="Fechar menu" onClick={() => setMobileNavOpen(false)}><X size={18} /></button></div>
      <div className="demo-chip"><span className="demo-chip__pulse" />AMBIENTE DE DEMONSTRAÇÃO</div>
      <div className="nav-group-label">Jornada ativa</div>
      <nav className="side-nav">
        {pages.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${view === id ? 'nav-link--active' : ''}`} onClick={() => navigate(id)} aria-current={view === id ? 'page' : undefined}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{id === 'outbox' && <span className="nav-count">{state.outbox.length}</span>}</button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help"><span className="sidebar-help__icon"><BookOpenCheck size={17} /></span><div><strong>Fluxo de bancas</strong><span>Da agenda ao depósito</span></div><ArrowRight size={15} /></div>
        <div className="sidebar-footnote">Projeto demonstrativo · Dados fictícios</div>
      </div>
    </aside>
    {mobileNavOpen && <button className="nav-scrim" aria-label="Fechar navegação" onClick={() => setMobileNavOpen(false)} />}
    <div className="main-column">
      <header className="topbar">
        <button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
        <div className="breadcrumbs"><span>Fatec Bauru</span><span className="breadcrumb-divider">/</span><strong>{activePage.label}</strong></div>
        <div className="topbar-actions">
          <div className="profile-select-wrap"><label htmlFor="profile-selector">Perfil de demonstração</label><select id="profile-selector" value={profileId} onChange={(event) => changeProfile(event.target.value)}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label} · {profile.name}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></div>
          <button className="icon-button notification-button" aria-label="Notificações demonstrativas" onClick={() => setToast({ kind: 'info', message: 'Você está em um cenário de demonstração.' })}><Bell size={18} /><span /></button>
          <div className="avatar" aria-label={`Perfil de ${viewer.name}`}>{viewer.initials}</div>
        </div>
      </header>
      {storageError && <div className="storage-warning" role="alert"><AlertCircle size={17} /> O navegador bloqueou o armazenamento local. As alterações podem não sobreviver a uma recarga.</div>}
      <main id="main-content" className="main-content" key={view}>
        {view === 'overview' && <OverviewPage {...props} />}
        {view === 'schedule' && <SchedulePage {...props} />}
        {view === 'post-defense' && <PostDefensePage {...props} />}
        {view === 'guest' && <GuestPage {...props} />}
        {view === 'student' && <StudentPage {...props} />}
        {view === 'consultation' && <ConsultationPage {...props} />}
        {view === 'coordination' && <CoordinationPage {...props} />}
        {view === 'outbox' && <OutboxPage state={state} navigate={navigate} />}
      </main>
      <footer className="app-footer"><span>II Hackathon AMS Fatec Bauru/IBM</span><span>·</span><span>Protótipo navegável</span><button onClick={restoreDemo}><RotateCcw size={14} /> Restaurar cenário inicial</button></footer>
    </div>
    {toast && <div className={`toast toast--${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}><span className="toast__icon">{toast.kind === 'success' ? <CheckCircle2 size={18} /> : toast.kind === 'error' ? <AlertCircle size={18} /> : <Bell size={18} />}</span>{toast.message}<button aria-label="Fechar aviso" onClick={() => setToast(null)}><X size={15} /></button></div>}
  </div>
}

function OverviewPage({ state, navigate }: PageProps) {
  const counts = {
    upcoming: state.boards.filter((board) => board.status === 'agendada').length,
    pending: state.invitations.filter((invitation) => invitation.status === 'pendente').length,
    corrections: state.boards.filter((board) => board.status === 'pendente-correcao').length,
  }
  const nextBoards = [...state.boards].filter((board) => board.status !== 'concluida').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)
  return <>
    <PageHeader title="Acompanhe suas bancas" description="Agenda, confirmações e próximos passos em um único fluxo." actions={<button className="button button--primary" onClick={() => navigate('schedule')}><Plus size={17} /> Nova banca</button>} />
    <div className="overview-strip" aria-label="Resumo do cenário demonstrativo">
      <SummaryItem icon={<CalendarDays size={18} />} label="Bancas agendadas" value={String(counts.upcoming).padStart(2, '0')} accent="red" detail="no cenário atual" />
      <SummaryItem icon={<Mail size={18} />} label="Convites aguardando" value={String(counts.pending).padStart(2, '0')} accent="amber" detail="resposta dos convidados" />
      <SummaryItem icon={<Clock3 size={18} />} label="Em correção" value={String(counts.corrections).padStart(2, '0')} accent="blue" detail="acompanhar prazo" />
      <SummaryItem icon={<FileCheck2 size={18} />} label="Etapas no histórico" value={String(state.history.length).padStart(2, '0')} accent="green" detail="eventos registrados" />
    </div>
    <div className="dashboard-grid">
      <section className="panel panel--agenda" aria-labelledby="next-bancas-heading">
        <div className="panel-heading"><div><h2 id="next-bancas-heading">Próximas bancas</h2><p>Uma visão do que pede atenção primeiro</p></div><button className="text-button" onClick={() => navigate('schedule')}>Ver agenda <ArrowRight size={15} /></button></div>
        <div className="agenda-list">
          {nextBoards.length === 0 ? <EmptyState title="Nenhuma banca nesta lista" detail="Cadastre uma banca para acompanhar as próximas etapas." /> : nextBoards.map((board) => {
            const work = state.works.find((item) => item.id === board.workId)!
            const course = state.courses.find((item) => item.id === work.courseId)!
            const advisor = state.users.find((item) => item.id === work.advisorId)!
            const authors = work.authorIds.map((id) => state.users.find((user) => user.id === id)?.name).filter(Boolean).join(' e ')
            const date = new Date(`${board.date}T12:00:00`)
            return <button className="agenda-row" key={board.id} onClick={() => navigate(board.status === 'agendada' ? 'schedule' : 'post-defense')}>
              <span className="agenda-date"><strong>{String(date.getDate()).padStart(2, '0')}</strong><small>{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small></span>
              <span className="agenda-details"><strong>{work.title}</strong><span>{authors} · {course.code}</span><small>{board.start}–{board.end} · {board.location}</small></span>
              <span className="agenda-side"><StatusBadge status={board.status} /><small>{advisor.name}</small></span>
            </button>
          })}
        </div>
        <div className="agenda-footnote"><span className="mini-mark" /> Cenário fictício compartilhado entre os perfis</div>
      </section>
      <section className="panel panel--priority" aria-labelledby="priorities-heading">
        <div className="panel-heading"><div><h2 id="priorities-heading">Próxima ação</h2><p>O que destrava o fluxo</p></div><span className="panel-heading-icon"><Settings2 size={18} /></span></div>
        <div className="priority-lead"><span className="priority-lead__badge"><AlertCircle size={17} /></span><div><strong>{counts.pending} resposta(s) ainda pendente(s)</strong><p>Convites aguardam resposta dos docentes convidados.</p><button className="text-button" onClick={() => navigate('outbox')}>Abrir caixa de saída <ArrowRight size={15} /></button></div></div>
        <div className="priority-divider" />
        <div className="priority-line"><span className="priority-line__icon priority-line__icon--amber"><FileText size={16} /></span><div><strong>Conferir documentos</strong><span>{state.documents.filter((doc) => doc.status === 'pendente' || doc.status === 'ajustes-solicitados').length} itens aguardam revisão ou envio</span></div><button className="icon-button icon-button--small" aria-label="Abrir pós-banca" onClick={() => navigate('post-defense')}><ArrowRight size={15} /></button></div>
        <div className="priority-line"><span className="priority-line__icon priority-line__icon--blue"><UsersRound size={16} /></span><div><strong>Nova versão enviada</strong><span>Versão 2 aguarda avaliação do orientador</span></div><button className="icon-button icon-button--small" aria-label="Abrir revisão" onClick={() => navigate('post-defense')}><ArrowRight size={15} /></button></div>
        <div className="priority-hint"><Check size={15} /> Aprovação fica ligada à versão analisada.</div>
      </section>
    </div>
    <section className="panel panel--flow" aria-labelledby="flow-heading">
      <div className="panel-heading"><div><h2 id="flow-heading">Trilha do trabalho</h2><p>Da formação da banca ao registro do depósito</p></div><span className="flow-caption"><span className="flow-caption-dot" /> 5 trabalhos fictícios</span></div>
      <div className="workflow-track" aria-label="Etapas do ciclo da banca">
        {[
          { label: 'Agendamento', complete: 4, total: 5, tone: 'red', icon: CalendarDays },
          { label: 'Convites', complete: 3, total: 5, tone: 'amber', icon: Mail },
          { label: 'Defesa e ata', complete: 3, total: 5, tone: 'blue', icon: FileText },
          { label: 'Versão final', complete: 2, total: 5, tone: 'green', icon: ClipboardCheck },
          { label: 'Depósito', complete: 1, total: 5, tone: 'slate', icon: BookOpenCheck },
        ].map(({ label, complete, total, tone, icon: Icon }, index) => <div className={`workflow-step workflow-step--${tone}`} key={label}>
          <span className="workflow-step__index">{String(index + 1).padStart(2, '0')}</span><span className="workflow-step__icon"><Icon size={17} /></span><div className="workflow-step__body"><strong>{label}</strong><span>{complete} de {total} trabalhos</span><div className="workflow-bar"><span style={{ width: `${(complete / total) * 100}%` }} /></div></div>
        </div>)}
      </div>
    </section>
  </>
}

function SummaryItem({ icon, label, value, detail, accent }: { icon: ReactNode; label: string; value: string; detail: string; accent: string }) {
  return <div className={`summary-item summary-item--${accent}`}><span className="summary-item__icon">{icon}</span><span className="summary-item__label">{label}</span><strong>{value}</strong><small>{detail}</small></div>
}

function OutboxPage({ state, navigate }: { state: DemoState; navigate: (view: View) => void }) {
  return <><PageHeader title="Caixa de saída demonstrativa" description="Convites registrados nesta demonstração. Nenhum e-mail real foi enviado." />
    <section className="panel table-panel"><div className="panel-heading"><div><h2>Convites preparados</h2><p>Links individuais para responder à banca</p></div><span className="simulation-tag"><Mail size={14} /> Envio simulado</span></div>
      <div className="table-scroll"><table><thead><tr><th>Docente</th><th>Trabalho</th><th>Data da banca</th><th>Situação</th><th>Link demonstrativo</th></tr></thead><tbody>
        {state.outbox.map((message) => {
          const invite = state.invitations.find((item) => item.id === message.invitationId)!
          const board = state.boards.find((item) => item.id === invite.boardId)!
          const work = state.works.find((item) => item.id === board.workId)!
          const invitee = state.users.find((item) => item.id === invite.inviteeId)!
          return <tr key={message.id}><td><strong>{invitee.name}</strong><small>{invitee.email}</small></td><td>{work.title}</td><td>{new Date(`${board.date}T12:00:00`).toLocaleDateString('pt-BR')}</td><td><StatusBadge status={invite.status} /></td><td><button className="inline-link" onClick={() => { window.history.pushState({}, '', `?convite=${invite.token}`); navigate('guest') }}>{`?convite=${invite.token}`} <ArrowRight size={13} /></button></td></tr>
        })}
      </tbody></table></div>
      <p className="table-note"><AlertCircle size={15} /> A caixa mostra o estado demonstrativo; não representa entrega ou resposta em uma conta de e-mail.</p>
    </section></>
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><span><Search size={18} /></span><div><strong>{title}</strong><p>{detail}</p></div></div>
}
