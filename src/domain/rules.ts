import type { Availability, DefenseBoard, Invitation } from './types'

export function correctionDeadline(defenseDate: string): string {
  const [year, month, day] = defenseDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + 15))
  return date.toISOString().slice(0, 10)
}

function overlaps(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && startB < endA
}

export function detectConflicts(
  candidate: Pick<DefenseBoard, 'date' | 'start' | 'end' | 'location'> & { evaluatorIds: string[] },
  boards: DefenseBoard[],
  invitations: Invitation[],
  availabilities: Availability[],
): string[] {
  const conflicts = new Set<string>()

  for (const board of boards) {
    if (board.status === 'concluida' || board.date !== candidate.date || !overlaps(candidate.start, candidate.end, board.start, board.end)) continue
    if (candidate.location.trim().toLowerCase() === board.location.trim().toLowerCase()) {
      conflicts.add(`Sala ocupada: ${board.location} (${board.start}–${board.end})`)
    }

    const boardEvaluators = invitations
      .filter((invitation) => invitation.boardId === board.id && (invitation.status === 'aceito' || invitation.status === 'pendente'))
      .map((invitation) => invitation.inviteeId)
    const sharedEvaluator = candidate.evaluatorIds.find((id) => boardEvaluators.includes(id))
    if (sharedEvaluator) conflicts.add(`Docente convidado para outra banca neste horário.`)
  }

  for (const evaluatorId of candidate.evaluatorIds) {
    const available = availabilities.some((slot) =>
      slot.userId === evaluatorId && slot.date === candidate.date &&
      slot.start <= candidate.start && slot.end >= candidate.end,
    )
    if (!available) conflicts.add('Há docente sem disponibilidade cadastrada para todo o intervalo.')
  }

  return [...conflicts]
}

export function validateInvitation(invitation: Invitation | undefined, now = new Date()):
  | { ok: true }
  | { ok: false; reason: 'invalido' | 'expirado' | 'utilizado' | 'respondido' } {
  if (!invitation) return { ok: false, reason: 'invalido' }
  if (invitation.status === 'expirado' || new Date(invitation.expiresAt) < now) return { ok: false, reason: 'expirado' }
  if (invitation.usedAt) return { ok: false, reason: 'utilizado' }
  if (invitation.status !== 'pendente') return { ok: false, reason: 'respondido' }
  return { ok: true }
}

export function suggestAlternativeSlots(
  date: string,
  durationMinutes: number,
  evaluatorIds: string[],
  availabilities: Availability[],
  boards: DefenseBoard[],
  invitations: Invitation[],
  location: string,
): Array<{ start: string; end: string }> {
  const options: Array<{ start: string; end: string }> = []
  const starts = new Set(availabilities.filter((slot) => slot.date === date).flatMap((slot) => {
    const [hour, minute] = slot.start.split(':').map(Number)
    return Array.from({ length: 20 }, (_, index) => hour * 60 + minute + index * 30)
  }))
  for (const startMinutes of starts) {
    const endMinutes = startMinutes + durationMinutes
    if (endMinutes > 24 * 60) continue
    const start = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`
    const end = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
    const covered = evaluatorIds.every((id) => availabilities.some((slot) => slot.userId === id && slot.date === date && slot.start <= start && slot.end >= end))
    if (!covered) continue
    const conflicts = detectConflicts({ date, start, end, location, evaluatorIds }, boards, invitations, availabilities)
    if (!conflicts.length) options.push({ start, end })
  }
  return [...new Map(options.map((option) => [`${option.start}-${option.end}`, option])).values()].slice(0, 3)
}
