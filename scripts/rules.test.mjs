import assert from 'node:assert/strict'
import test from 'node:test'
import { correctionDeadline, detectConflicts, suggestAlternativeSlots, validateInvitation } from '../src/domain/rules.ts'

test('calcula prazo demonstrativo com 15 dias corridos', () => {
  assert.equal(correctionDeadline('2026-10-07'), '2026-10-22')
  assert.equal(correctionDeadline('2026-12-25'), '2027-01-09')
})

test('detecta sobreposição de sala e docente confirmado', () => {
  const board = {
    id: 'b1', workId: 'w1', date: '2026-10-22', start: '14:00', end: '15:00',
    modality: 'presencial', location: 'B-203', status: 'agendada', semester: 2, year: 2026,
  }
  const invitation = {
    id: 'i1', boardId: 'b1', inviteeId: 'u1', status: 'aceito', token: 'demo',
    expiresAt: '2026-10-23T00:00:00Z', sentAt: '2026-10-01T12:00:00Z',
  }
  const conflicts = detectConflicts(
    { date: board.date, start: '14:30', end: '15:30', location: 'B-203', evaluatorIds: ['u1'] },
    [board], [invitation], [{ userId: 'u1', date: board.date, start: '14:00', end: '16:00' }],
  )
  assert.equal(conflicts.length, 2)
})

test('considera docente convidado pendente como conflito de horário', () => {
  const board = { id: 'b1', workId: 'w1', date: '2026-10-22', start: '14:00', end: '15:00', modality: 'presencial', location: 'B-203', status: 'agendada', semester: 2, year: 2026 }
  const invitation = { id: 'i1', boardId: 'b1', inviteeId: 'u1', status: 'pendente', token: 'demo', expiresAt: '2026-10-23T00:00:00Z', sentAt: '2026-10-01T12:00:00Z' }
  const conflicts = detectConflicts({ date: board.date, start: '14:30', end: '15:30', location: 'C-101', evaluatorIds: ['u1'] }, [board], [invitation], [{ userId: 'u1', date: board.date, start: '14:00', end: '16:00' }])
  assert.ok(conflicts.some((conflict) => conflict.includes('convidado')))
})

test('sugere interseção de disponibilidade mesmo com intervalos diferentes', () => {
  const slots = suggestAlternativeSlots('2026-10-22', 60, ['u1', 'u2'], [
    { userId: 'u1', date: '2026-10-22', start: '14:00', end: '16:00' },
    { userId: 'u2', date: '2026-10-22', start: '14:30', end: '16:30' },
  ], [], [], 'Sala B-203')
  assert.ok(slots.some((slot) => slot.start === '14:30' && slot.end === '15:30'))
})

test('token expira ou fica inutilizável após resposta', () => {
  const invitation = {
    id: 'i1', boardId: 'b1', inviteeId: 'u1', status: 'pendente', token: 'demo',
    expiresAt: '2026-10-22T10:00:00Z', sentAt: '2026-10-20T10:00:00Z',
  }
  assert.deepEqual(validateInvitation(invitation, new Date('2026-10-21T10:00:00Z')), { ok: true })
  assert.deepEqual(validateInvitation(invitation, new Date('2026-10-23T10:00:00Z')), { ok: false, reason: 'expirado' })
  assert.deepEqual(validateInvitation({ ...invitation, usedAt: '2026-10-20T11:00:00Z' }, new Date('2026-10-21T10:00:00Z')), { ok: false, reason: 'utilizado' })
})
