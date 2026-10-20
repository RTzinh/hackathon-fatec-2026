import type { AccessLevel, Availability, DefenseBoard, Invitation, PdfInspection, StoredFile, TermData } from './types'

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

/** Fim de semestre do calendário demonstrativo; a unidade define o calendário real. */
export const DEMO_SEMESTER_END: Record<1 | 2, string> = { 1: '06-30', 2: '12-15' }

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/** Portaria 4069/2024, Art. 10, §2º: envio à biblioteca em até 90 dias após o fim do semestre letivo. */
export function libraryDeadline(semester: 1 | 2, year: number): string {
  return addDays(`${year}-${DEMO_SEMESTER_END[semester]}`, 90)
}

export function daysBetween(from: string, to: string): number {
  const toUTC = (value: string) => { const [y, m, d] = value.split('-').map(Number); return Date.UTC(y, m - 1, d) }
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000)
}

function plain(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
}

/**
 * Portaria 4069/2024, Art. 6: curso_ano_semestre_primeiroautor_titulo.pdf, sem espaços, acentos,
 * caracteres especiais ou maiúsculas, com até as 5 primeiras palavras do título. O TA recebe o sufixo _TA.
 */
export function ricFileName(input: { courseCode: string; year: number; semester: 1 | 2; firstAuthor: string; title: string }, kind: 'trabalho' | 'termo' = 'trabalho'): string {
  const compact = (text: string) => plain(text).split(/\s+/).filter(Boolean)
  const titleWords = compact(input.title).slice(0, 5).join('')
  const base = [compact(input.courseCode).join(''), input.year, input.semester, compact(input.firstAuthor).join(''), titleWords].join('_')
  return `${base}${kind === 'termo' ? '_TA' : ''}.pdf`
}

/** Art. 14: texto integral só para nota igual ou superior a 9 com indicação da banca. */
export function integralAllowed(grade?: number, nominated?: boolean): boolean {
  return grade !== undefined && grade >= 9 && nominated === true
}

export function suggestedAccessLevel(grade?: number, nominated?: boolean): AccessLevel {
  return integralAllowed(grade, nominated) ? 'integral' : 'restrito'
}

/**
 * PDF/A exige metadados XMP sem compressão com a identificação pdfaid:part. Procurar essa marca
 * aponta se o arquivo se declara PDF/A; não substitui um validador completo como o veraPDF.
 */
export function inspectPdfBytes(bytes: Uint8Array): PdfInspection {
  const text = new TextDecoder('latin1').decode(bytes)
  const isPdf = text.startsWith('%PDF-')
  const match = text.match(/pdfaid:part\s*=\s*["'](\d)["']|<pdfaid:part>\s*(\d)\s*<\/pdfaid:part>/)
  return { isPdf, pdfaPart: match ? match[1] ?? match[2] : undefined, inspectedBytes: bytes.length }
}

export const MAX_WORK_BYTES = 10 * 1024 ** 3
export const MAX_TERM_BYTES = 1024 ** 3

export type CheckResult = { id: string; label: string; ok: boolean; detail: string }

export function checkRicFile(file: StoredFile | undefined, expectedName: string, maxBytes: number): CheckResult[] {
  if (!file) return [{ id: 'arquivo', label: 'Arquivo anexado', ok: false, detail: 'Nenhum arquivo selecionado.' }]
  const inspection = file.inspection
  return [
    { id: 'pdf', label: 'Arquivo PDF', ok: Boolean(inspection?.isPdf), detail: inspection ? (inspection.isPdf ? 'Cabeçalho %PDF encontrado.' : 'O conteúdo não começa com %PDF.') : 'Conteúdo não inspecionado; selecione o arquivo novamente.' },
    { id: 'pdfa', label: 'Declaração PDF/A', ok: Boolean(inspection?.pdfaPart), detail: inspection?.pdfaPart ? `Metadados declaram PDF/A-${inspection.pdfaPart}.` : 'Metadado pdfaid:part não encontrado.' },
    { id: 'tamanho', label: `Tamanho até ${maxBytes >= 1024 ** 3 ? `${maxBytes / 1024 ** 3} GB` : `${maxBytes} B`}`, ok: file.size <= maxBytes, detail: `${(file.size / 1_048_576).toFixed(2)} MB` },
    { id: 'nome', label: 'Nome no padrão da Portaria', ok: file.name === expectedName, detail: file.name === expectedName ? file.name : `Esperado: ${expectedName}` },
  ]
}

export function checkTermData(term: TermData | undefined, board: Pick<DefenseBoard, 'grade' | 'nominatedByBoard' | 'date'>): CheckResult[] {
  return [
    { id: 'ata', label: 'Nota e indicação vindas da ata', ok: board.grade !== undefined && board.nominatedByBoard !== undefined, detail: board.grade !== undefined ? `Nota ${board.grade.toLocaleString('pt-BR')} · ${board.nominatedByBoard ? 'indicado' : 'não indicado'} pela banca · defesa em ${board.date.split('-').reverse().join('/')}` : 'Registre nota e indicação ao conferir a ata.' },
    { id: 'acesso', label: 'Nível de acesso coerente', ok: Boolean(term) && (term!.accessLevel !== 'integral' || integralAllowed(board.grade, board.nominatedByBoard)) && (term!.accessLevel !== 'embargo' || Boolean(term!.embargoUntil)), detail: !term ? 'Preencha o termo.' : term.accessLevel === 'integral' && !integralAllowed(board.grade, board.nominatedByBoard) ? 'Integral exige nota ≥ 9 e indicação da banca (Art. 14).' : term.accessLevel === 'embargo' && !term.embargoUntil ? 'Informe a data final do embargo.' : 'Escolha compatível com a nota e a indicação.' },
    { id: 'correcoes', label: 'Declaração de correções realizadas', ok: Boolean(term?.correctionsDeclared), detail: 'Os autores declaram que as correções da banca foram feitas.' },
    { id: 'assinaturas', label: 'Assinaturas: autores, orientador e coordenador', ok: Boolean(term?.signatures.authors && term.signatures.advisor && term.signatures.coordinator), detail: term ? [term.signatures.authors ? 'autores ✓' : 'autores pendente', term.signatures.advisor ? 'orientador ✓' : 'orientador pendente', term.signatures.coordinator ? 'coordenador ✓' : 'coordenador pendente'].join(' · ') : 'Nenhuma assinatura conferida.' },
  ]
}
