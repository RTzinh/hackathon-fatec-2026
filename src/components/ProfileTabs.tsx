import { ClipboardCheck, GraduationCap, Mail, UserRound } from 'lucide-react'
import type { ProfileRole } from '../domain/types'
import './ProfileTabs.css'

export type DemoProfile = { id: string; role: ProfileRole; label: string; name: string }

const icons: Partial<Record<ProfileRole, typeof Mail>> = { orientador: UserRound, convidado: Mail, aluno: GraduationCap, coordenacao: ClipboardCheck }

/** Troca de perfil em um clique: botões no desktop, lista nativa no celular. */
export function ProfileTabs({ profiles, value, onChange }: { profiles: DemoProfile[]; value: string; onChange: (id: string) => void }) {
  return <div className="profile-tabs">
    <span className="profile-tabs__label" id="profile-tabs-label">Ver como</span>
    <div className="profile-tabs__group" role="group" aria-labelledby="profile-tabs-label">
      {profiles.map((profile) => {
        const Icon = icons[profile.role] ?? UserRound
        return <button key={profile.id} type="button" className="profile-tabs__item" data-profile={profile.id} aria-pressed={profile.id === value} title={`${profile.label} · ${profile.name}`} onClick={() => onChange(profile.id)}><Icon size={15} aria-hidden="true" /><span>{profile.label}</span></button>
      })}
    </div>
    <select id="profile-selector" className="profile-tabs__select" aria-label="Ver como" value={value} onChange={(event) => onChange(event.target.value)}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label} · {profile.name}</option>)}</select>
  </div>
}
