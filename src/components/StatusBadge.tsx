import type { ReactNode } from 'react'

const labels: Record<string, string> = {
  agendada: 'Agendada', realizada: 'Realizada', 'pendente-correcao': 'Pendente de correção',
  concluida: 'Concluída', pendente: 'Pendente', aceito: 'Aceito', recusado: 'Recusado',
  expirado: 'Expirado', enviado: 'Enviado', 'ajustes-solicitados': 'Ajustes solicitados',
  aprovado: 'Aprovado', enviada: 'Enviada', aprovada: 'Aprovada', aberta: 'Aberta',
  revisada: 'Revisada', 'nao-encaminhado': 'Não encaminhado', encaminhado: 'Encaminhado', registrado: 'Registrado',
}

export function statusLabel(status: string): string { return labels[status] ?? status }

export function StatusBadge({ status, children }: { status: string; children?: ReactNode }) {
  return <span className={`status status--${status}`}><span aria-hidden="true" className="status__dot" />{children ?? labels[status] ?? status}</span>
}
