import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { BrandImage } from '../components/BrandImage'
import type { ProfileRole, User } from '../domain/types'
import './LoginPage.css'

export type LoginAccount = { user: User; label: string; /** valor de `?perfil=` que abre direto neste perfil */ param: string }
export type NewAccount = { name: string; email: string; role: Exclude<ProfileRole, 'publico'> }

interface LoginPageProps {
  /** Os quatro perfis de teste, na ordem em que aparecem na lista. */
  accounts: LoginAccount[]
  /** Todos os usuários do estado, para reconhecer um e-mail digitado. */
  users: User[]
  /** Papéis que podem ser escolhidos ao criar uma conta. */
  roles: Array<{ role: NewAccount['role']; label: string }>
  onEnter: (userId: string) => void
  /** Devolve uma mensagem de erro quando não pôde criar; sem retorno, entrou. */
  onCreate: (account: NewAccount) => string | void
}

/** Entrada de demonstração: não valida nada; só decide qual perfil esta aba vai usar. */
export function LoginPage({ accounts, users, roles, onEnter, onCreate }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'create'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [blocked, setBlocked] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    const typed = email.trim().toLowerCase()
    const match = typed ? users.find((user) => user.email.toLowerCase() === typed) : undefined
    onEnter(match?.id ?? accounts[0].user.id)
  }

  function openAllProfiles() {
    const opened = accounts.map((account) => window.open(`?perfil=${account.param}`, '_blank'))
    setBlocked(opened.some((tab) => !tab))
  }

  return <div className="login">
    <main className="login__card" aria-labelledby="login-title">
      <div className="login__brand">
        <BrandImage file="integrae-logo.png" className="login__logo" alt="Integrae" fallback={<span className="login__wordmark">integrae</span>} />
        <p>Gestão de bancas de TCC · Fatec Bauru</p>
      </div>
      {mode === 'login' ? <>
        <h1 id="login-title">Entrar</h1>
        <form className="login__form" onSubmit={submit} noValidate>
          <label className="field"><span>E-mail</span><input name="email" type="text" inputMode="email" autoComplete="off" autoFocus placeholder="nome@exemplo.edu.br" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="field"><span>Senha</span><input name="password" type="password" autoComplete="off" placeholder="Qualquer valor" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="button button--primary login__submit" type="submit">Entrar <ArrowRight size={16} /></button>
        </form>

        <section className="login__accounts" aria-labelledby="accounts-title">
          <h2 id="accounts-title">Contas de teste</h2>
          <ul>
            {accounts.map(({ user, label, param }) => <li key={user.id}>
              <button type="button" className="login__account" data-account={param} onClick={() => onEnter(user.id)}>
                <span className="login__avatar" aria-hidden="true">{user.initials}</span>
                <span className="login__account-text"><strong>{user.name}</strong><small>{label} · {user.email}</small></span>
                <ArrowRight size={15} className="login__account-arrow" aria-hidden="true" />
              </button>
            </li>)}
          </ul>
          <button type="button" className="button login__open-all" onClick={openAllProfiles}><ExternalLink size={15} /> Abrir os 4 perfis em abas</button>
          {blocked && <p className="login__hint" role="status">O navegador bloqueou algumas abas. Permita pop-ups para este endereço e tente de novo.</p>}
        </section>

        <p className="login__create">Primeira vez aqui? <button type="button" className="login__link" onClick={() => setMode('create')}>Criar conta</button></p>
      </> : <CreateAccount roles={roles} onCreate={onCreate} onBack={() => setMode('login')} />}
      <p className="login__note">Demonstração: não há autenticação real.</p>
    </main>
  </div>
}

function CreateAccount({ roles, onCreate, onBack }: Pick<LoginPageProps, 'roles' | 'onCreate'> & { onBack: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<NewAccount['role']>(roles[0].role)
  const [error, setError] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) { setError('Informe o nome.'); return }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Informe um e-mail institucional válido, como nome@exemplo.edu.br.'); return }
    const failure = onCreate({ name: name.trim(), email: email.trim(), role })
    if (failure) setError(failure)
  }

  return <>
    <h1 id="login-title">Criar conta</h1>
    <form className="login__form" onSubmit={submit} noValidate>
      <label className="field"><span>Nome</span><input name="name" type="text" autoComplete="off" autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="field"><span>E-mail institucional</span><input name="new-email" type="text" inputMode="email" autoComplete="off" placeholder="nome@exemplo.edu.br" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label className="field"><span>Papel</span><select name="role" value={role} onChange={(event) => setRole(event.target.value as NewAccount['role'])}>{roles.map((item) => <option key={item.role} value={item.role}>{item.label}</option>)}</select></label>
      {error && <p className="login__error" role="alert">{error}</p>}
      <button className="button button--primary login__submit" type="submit">Criar conta e entrar <ArrowRight size={16} /></button>
    </form>
    <p className="login__create"><button type="button" className="login__link" onClick={onBack}>Voltar ao login</button></p>
  </>
}
