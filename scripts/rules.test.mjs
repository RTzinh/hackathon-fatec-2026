import assert from 'node:assert/strict'
import test from 'node:test'
import { checkRicFile, checkTermData, correctionDeadline, detectConflicts, inspectPdfBytes, integralAllowed, libraryDeadline, ricFileName, suggestAlternativeSlots, validateInvitation } from '../src/domain/rules.ts'

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

test('gera nome de arquivo no padrão da Portaria 4069/2024', () => {
  const input = { courseCode: 'DSM', year: 2026, semester: 2, firstAuthor: 'Davi Rocha', title: 'Painel de indicadores para cooperativas locais' }
  assert.equal(ricFileName(input), 'dsm_2026_2_davirocha_paineldeindicadoresparacooperativas.pdf')
  assert.equal(ricFileName(input, 'termo'), 'dsm_2026_2_davirocha_paineldeindicadoresparacooperativas_TA.pdf')
  assert.equal(ricFileName({ ...input, firstAuthor: 'Júlia Ferreira', title: 'Rastreabilidade: resíduos!' }), 'dsm_2026_2_juliaferreira_rastreabilidaderesiduos.pdf')
})

test('texto integral só com nota ≥ 9 e indicação da banca', () => {
  assert.equal(integralAllowed(9, true), true)
  assert.equal(integralAllowed(9.5, false), false)
  assert.equal(integralAllowed(8.9, true), false)
  assert.equal(integralAllowed(undefined, true), false)
})

test('prazo da biblioteca é fim do semestre + 90 dias', () => {
  assert.equal(libraryDeadline(2, 2026), '2027-03-15')
  assert.equal(libraryDeadline(1, 2026), '2026-09-28')
})

test('detecta declaração PDF/A nos metadados XMP', () => {
  const encode = (text) => new TextEncoder().encode(text)
  assert.deepEqual(inspectPdfBytes(encode('%PDF-1.7 <rdf:Description pdfaid:part="2" pdfaid:conformance="B"/>')), { isPdf: true, pdfaPart: '2', inspectedBytes: 66 })
  assert.equal(inspectPdfBytes(encode('%PDF-1.7 <pdfaid:part>1</pdfaid:part>')).pdfaPart, '1')
  assert.equal(inspectPdfBytes(encode('%PDF-1.4 sem metadados')).pdfaPart, undefined)
  assert.equal(inspectPdfBytes(encode('PK zip')).isPdf, false)
})

test('valida arquivo e termo antes da conferência', () => {
  const file = { name: 'x_TA.pdf', type: 'application/pdf', size: 1000, selectedAt: '', persistence: 'metadados-locais', inspection: { isPdf: true, pdfaPart: '2', inspectedBytes: 1000 } }
  assert.ok(checkRicFile(file, 'x_TA.pdf', 1024 ** 3).every((check) => check.ok))
  assert.equal(checkRicFile({ ...file, name: 'Termo.pdf' }, 'x_TA.pdf', 1024 ** 3).find((check) => check.id === 'nome').ok, false)
  const term = { accessLevel: 'integral', fundingAgency: 'nao', correctionsDeclared: true, signatures: { authors: true, advisor: true, coordinator: true } }
  assert.equal(checkTermData(term, { grade: 8.5, nominatedByBoard: true, date: '2026-10-07' }).find((check) => check.id === 'acesso').ok, false)
  assert.ok(checkTermData({ ...term, accessLevel: 'restrito' }, { grade: 8.5, nominatedByBoard: true, date: '2026-10-07' }).every((check) => check.ok))
  assert.equal(checkTermData({ ...term, signatures: { ...term.signatures, coordinator: false } }, { grade: 9.5, nominatedByBoard: true, date: '2026-10-07' }).find((check) => check.id === 'assinaturas').ok, false)
})
