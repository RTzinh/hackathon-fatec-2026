export type ProfileRole = 'orientador' | 'convidado' | 'aluno' | 'coordenacao' | 'publico'
export type BoardStatus = 'agendada' | 'realizada' | 'pendente-correcao' | 'concluida'
export type InvitationStatus = 'pendente' | 'aceito' | 'recusado' | 'expirado'
export type DocumentStatus = 'pendente' | 'enviado' | 'ajustes-solicitados' | 'aprovado'
export type VersionStatus = 'enviada' | 'ajustes-solicitados' | 'aprovada'
export type DepositStatus = 'nao-encaminhado' | 'encaminhado' | 'registrado'

export interface User {
  id: string
  name: string
  email: string
  role: Exclude<ProfileRole, 'publico'>
  initials: string
}

export interface Course {
  id: string
  name: string
  code: string
}

export interface Work {
  id: string
  title: string
  courseId: string
  advisorId: string
  authorIds: string[]
  workType: string
  hasProduct: boolean
  updatedAt: string
}

export interface WorkAuthor {
  workId: string
  userId: string
}

export interface DefenseBoard {
  id: string
  workId: string
  date: string
  start: string
  end: string
  modality: 'presencial' | 'online' | 'hibrida'
  location: string
  status: BoardStatus
  semester: 1 | 2
  year: number
  grade?: number
  nominatedByBoard?: boolean
}

export interface Invitation {
  id: string
  boardId: string
  inviteeId: string
  status: InvitationStatus
  token: string
  expiresAt: string
  usedAt?: string
  sentAt: string
}

export interface StoredFile {
  name: string
  type: string
  size: number
  selectedAt: string
  persistence: 'metadados-locais'
}

export interface BoardDocument {
  id: string
  boardId: string
  kind: 'ata' | 'autorizacao-ric-cps'
  status: DocumentStatus
  file?: StoredFile
  requestedAt?: string
  note?: string
}

export interface FinalVersion {
  id: string
  workId: string
  number: number
  file: StoredFile
  status: VersionStatus
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNote?: string
}

export interface CorrectionTask {
  id: string
  workId: string
  title: string
  detail: string
  source: 'banca' | 'sugestao-ia'
  status: 'aberta' | 'revisada' | 'concluida'
  reviewedBy?: string
}

export interface HistoryEvent {
  id: string
  boardId: string
  at: string
  actorId: string
  label: string
  detail: string
}

export interface DepositRecord {
  workId: string
  status: DepositStatus
  sentToLibraryAt?: string
  recordedAt?: string
  receiptUrl?: string
  receiptFile?: StoredFile
  note?: string
}

export interface Availability {
  userId: string
  date: string
  start: string
  end: string
}

export interface OutboxMessage {
  id: string
  invitationId: string
  sentAt: string
  state: 'simulado'
}

export interface DemoState {
  users: User[]
  courses: Course[]
  works: Work[]
  workAuthors: WorkAuthor[]
  boards: DefenseBoard[]
  invitations: Invitation[]
  documents: BoardDocument[]
  versions: FinalVersion[]
  correctionTasks: CorrectionTask[]
  history: HistoryEvent[]
  deposits: DepositRecord[]
  availabilities: Availability[]
  outbox: OutboxMessage[]
}
