import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, ExternalLink, FileText } from 'lucide-react'
import { FilePicker } from '../components/FilePicker'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import type { PageProps } from '../App'
import type { StoredFile } from '../domain/types'
import './ConsultationPage.css'

export function CoordinationPage({ state, setState, viewer, notify }: PageProps) {
  const [workId, setWorkId] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptFile, setReceiptFile] = useState<StoredFile | undefined>()
  const [note, setNote] = useState('')
  const rows = useMemo(() => state.works.map((work) => {
    const board = state.boards.find((item) => item.workId === work.id)
    const deposit = state.deposits.find((item) => item.workId === work.id) ?? { workId: work.id, status: 'nao-encaminhado' as const }
    const version = state.versions.find((item) => item.workId === work.id && item.status === 'aprovada')
    return { work, board, deposit, version, advisor: state.users.find((user) => user.id === work.advisorId) }
  }).filter((row) => row.board?.status !== 'agendada'), [state])

  function recordDeposit() {
    const row = rows.find((item) => item.work.id === workId)
    if (!row || (!receiptUrl.trim() && !receiptFile)) { notify({ kind: 'error', message: 'Informe um link ou selecione um comprovante.' }); return }
    if (!window.confirm(`Registrar o depósito demonstrativo de “${row.work.title}”?`)) return
    const now = new Date().toISOString()
    setState((current) => ({
      ...current,
      deposits: [...current.deposits.filter((item) => item.workId !== workId), { workId, status: 'registrado', sentToLibraryAt: current.deposits.find((item) => item.workId === workId)?.sentToLibraryAt ?? now, recordedAt: now, receiptUrl: receiptUrl.trim() || undefined, receiptFile, note: note.trim() || undefined }],
      history: row.board ? [...current.history, { id: `h-${Date.now().toString(36)}`, boardId: row.board.id, at: now, actorId: viewer.id, label: 'Depósito institucional registrado', detail: 'Registro demonstrativo de comprovante/link pela coordenação.' }] : current.history,
    }))
    setWorkId(''); setReceiptUrl(''); setReceiptFile(undefined); setNote('')
    notify({ kind: 'success', message: 'Registro de depósito salvo no cenário local.' })
  }
  function markForwarded(id: string) {
    if (!window.confirm('Registrar que o trabalho foi encaminhado à biblioteca? Esta ação não envia e-mail.')) return
    const now = new Date().toISOString()
    setState((current) => ({ ...current, deposits: [...current.deposits.filter((item) => item.workId !== id), { ...current.deposits.find((item) => item.workId === id), workId: id, status: 'encaminhado', sentToLibraryAt: now }] }))
    notify({ kind: 'success', message: 'Encaminhamento demonstrativo registrado; nenhum envio foi feito.' })
  }

  return <>
    <PageHeader title="Pendências da coordenação" description="Acompanhe itens do ciclo e registre depósito institucional por link ou comprovante." />
    <div className="overview-strip coordination-summary"><div className="summary-item summary-item--amber"><span className="summary-item__label">Sem registro</span><strong>{rows.filter((row) => row.deposit.status === 'nao-encaminhado').length}</strong><small>aguardam acompanhamento</small></div><div className="summary-item summary-item--blue"><span className="summary-item__label">Encaminhados</span><strong>{rows.filter((row) => row.deposit.status === 'encaminhado').length}</strong><small>registrados manualmente</small></div><div className="summary-item summary-item--green"><span className="summary-item__label">Depósitos registrados</span><strong>{rows.filter((row) => row.deposit.status === 'registrado').length}</strong><small>com comprovante/link</small></div></div>
    <section className="panel table-panel"><div className="panel-heading"><div><h2>Acompanhamento</h2><p>Situação acadêmica, correções e depósito são etapas separadas.</p></div><ClipboardCheck size={18} /></div><div className="table-scroll"><table><thead><tr><th>Trabalho</th><th>Aluno(s)</th><th>Orientador</th><th>Defesa</th><th>Versão aprovada</th><th>Depósito</th><th>Ação</th></tr></thead><tbody>{rows.map(({ work, board, deposit, version, advisor }) => <tr key={work.id}><td><strong>{work.title}</strong><small>{state.courses.find((course) => course.id === work.courseId)?.code}</small></td><td>{work.authorIds.map((id) => state.users.find((user) => user.id === id)?.name).join(', ')}</td><td>{advisor?.name}</td><td>{board ? new Date(`${board.date}T12:00:00`).toLocaleDateString('pt-BR') : '—'}<small>{board && <StatusBadge status={board.status} />}</small></td><td>{version ? `v${version.number}` : 'Ainda não'}</td><td><StatusBadge status={deposit.status} />{deposit.recordedAt && <small>{new Date(deposit.recordedAt).toLocaleDateString('pt-BR')}</small>}{deposit.receiptUrl && <a className="inline-link" href={deposit.receiptUrl} target="_blank" rel="noreferrer">Abrir link <ExternalLink size={12} /></a>}{deposit.receiptFile && <small><FileText size={12} /> {deposit.receiptFile.name}</small>}</td><td>{deposit.status === 'registrado' ? <span className="registered-label"><CheckCircle2 size={15} /> Registrado</span> : <button className="button button--small" onClick={() => markForwarded(work.id)}>Marcar encaminhado</button>}</td></tr>)}</tbody></table></div><p className="table-note">Marcar encaminhado só registra a etapa local. Nenhum e-mail ou integração com biblioteca é executado.</p></section>
    <section className="panel deposit-form"><div className="panel-heading"><div><h2>Registrar comprovante de depósito</h2><p>Registro manual para a demonstração.</p></div></div><div className="deposit-fields"><label>Trabalho<select value={workId} onChange={(event) => setWorkId(event.target.value)}><option value="">Selecione um trabalho</option>{rows.filter((row) => row.deposit.status !== 'registrado').map(({ work }) => <option key={work.id} value={work.id}>{work.title}</option>)}</select></label><label>Link do comprovante<input type="url" value={receiptUrl} onChange={(event) => setReceiptUrl(event.target.value)} placeholder="https://..." /></label><label>Observação<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Opcional" /></label><div className="deposit-file"><FilePicker label="Selecionar comprovante" file={receiptFile} onSelect={setReceiptFile} /></div><button className="button button--primary" onClick={recordDeposit}><CheckCircle2 size={16} /> Registrar depósito</button></div><p className="table-note">Arquivo não é enviado ao servidor. O navegador guarda só nome, tipo e tamanho.</p></section>
  </>
}
