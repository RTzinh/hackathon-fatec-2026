import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, ExternalLink, FileText, Library } from 'lucide-react'
import { FilePicker } from '../components/FilePicker'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { libraryDeadline } from '../domain/rules'
import type { PageProps } from '../App'
import type { StoredFile } from '../domain/types'
import { accessLabels } from '../domain/labels'
import './ConsultationPage.css'

export function LibraryPage({ state, setState, viewer, notify }: PageProps) {
  const [workId, setWorkId] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptFile, setReceiptFile] = useState<StoredFile | undefined>()
  const [note, setNote] = useState('')
  const rows = useMemo(() => state.deposits.filter((deposit) => deposit.status !== 'nao-encaminhado').map((deposit) => {
    const work = state.works.find((item) => item.id === deposit.workId)!
    const board = state.boards.find((item) => item.workId === work.id)
    const term = state.documents.find((item) => item.boardId === board?.id && item.kind === 'autorizacao-ric-cps')?.term
    return { deposit, work, board, term }
  }).sort((a, b) => (a.deposit.status === 'encaminhado' ? 0 : 1) - (b.deposit.status === 'encaminhado' ? 0 : 1)), [state])
  const queue = rows.filter((row) => row.deposit.status === 'encaminhado')

  function recordSubmission() {
    const row = queue.find((item) => item.work.id === workId)
    if (!row || (!receiptUrl.trim() && !receiptFile)) { notify({ kind: 'error', message: 'Selecione o trabalho e informe o link do registro ou um comprovante.' }); return }
    if (!window.confirm(`Registrar a submissão de “${row.work.title}” no RIC-CPS? Nenhuma integração é executada.`)) return
    const now = new Date().toISOString()
    setState((current) => ({
      ...current,
      deposits: current.deposits.map((item) => item.workId === workId ? { ...item, status: 'registrado', submittedBy: viewer.id, recordedAt: now, receiptUrl: receiptUrl.trim() || undefined, receiptFile, note: note.trim() || undefined } : item),
      history: row.board ? [...current.history, { id: `h-${Date.now().toString(36)}`, boardId: row.board.id, at: now, actorId: viewer.id, label: 'Submetido no RIC-CPS', detail: 'Registro manual do bibliotecário com link ou comprovante (demonstração).' }] : current.history,
    }))
    setWorkId(''); setReceiptUrl(''); setReceiptFile(undefined); setNote('')
    notify({ kind: 'success', message: 'Submissão registrada. O trabalho aparece como depositado na consulta.' })
  }

  return <>
    <PageHeader title="Fila da biblioteca" description="Pacotes encaminhados pelos orientadores. A submissão no RIC-CPS é feita pelo bibliotecário (Portaria 4069/2024, Art. 11)." />
    <section className="panel table-panel"><div className="panel-heading"><div><h2>Pacotes recebidos</h2><p>{queue.length} aguardando submissão</p></div><Library size={18} /></div>
      {rows.length ? <div className="table-scroll"><table><thead><tr><th>Trabalho</th><th>Arquivos do pacote</th><th>Acesso escolhido</th><th>Prazo</th><th>Situação</th></tr></thead><tbody>{rows.map(({ deposit, work, board, term }) => <tr key={work.id}>
        <td><strong>{work.title}</strong><small>{state.courses.find((course) => course.id === work.courseId)?.code} · nota {board?.grade?.toLocaleString('pt-BR') ?? '—'} · {board?.nominatedByBoard ? 'indicado' : 'não indicado'}</small></td>
        <td><ul className="package-files">{deposit.packageFiles?.map((name) => <li key={name}><FileText size={11} /> {name}</li>)}</ul>{deposit.academicServicesCopy && <small>Cópia do TA à Diretoria de Serviços Acadêmicos</small>}</td>
        <td>{term ? accessLabels[term.accessLevel] : '—'}{term?.accessLevel === 'embargo' && term.embargoUntil && <small>até {term.embargoUntil.split('-').reverse().join('/')}</small>}</td>
        <td>{board ? libraryDeadline(board.semester, board.year).split('-').reverse().join('/') : '—'}<small>Encaminhado em {deposit.sentToLibraryAt ? new Date(deposit.sentToLibraryAt).toLocaleDateString('pt-BR') : '—'}</small></td>
        <td><StatusBadge status={deposit.status} />{deposit.receiptUrl && <a className="inline-link" href={deposit.receiptUrl} target="_blank" rel="noreferrer">Abrir registro <ExternalLink size={12} /></a>}{deposit.receiptFile && <small><FileText size={12} /> {deposit.receiptFile.name}</small>}</td>
      </tr>)}</tbody></table></div> : <div className="empty-state"><span><Library size={18} /></span><div><strong>Nenhum pacote encaminhado</strong><p>Os pacotes aparecem quando o orientador valida o TA e encaminha à biblioteca.</p></div></div>}
      <p className="table-note"><AlertCircle size={14} /> Texto integral só é disponibilizado com nota ≥ 9 e indicação da banca (Art. 14); os demais trabalhos ficam com registro e resumo.</p>
    </section>
    <section className="panel deposit-form"><div className="panel-heading"><div><h2>Registrar submissão no RIC-CPS</h2><p>Registro manual; não há integração com o repositório.</p></div></div><div className="deposit-fields"><label>Trabalho<select value={workId} onChange={(event) => setWorkId(event.target.value)}><option value="">Selecione um pacote</option>{queue.map(({ work }) => <option key={work.id} value={work.id}>{work.title}</option>)}</select></label><label>Link do registro no RIC-CPS<input type="url" value={receiptUrl} onChange={(event) => setReceiptUrl(event.target.value)} placeholder="https://..." /></label><label>Observação<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Opcional" /></label><div className="deposit-file"><FilePicker label="Selecionar comprovante" file={receiptFile} onSelect={setReceiptFile} /></div><button className="button button--primary" onClick={recordSubmission}><CheckCircle2 size={16} /> Registrar submissão</button></div></section>
  </>
}
