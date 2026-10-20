import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle, CheckCircle2, ChevronDown, ExternalLink, FileText, Library } from 'lucide-react'
import { FilePicker } from '../components/FilePicker'
import { PageHeader } from '../components/PageHeader'
import { libraryDeadline } from '../domain/rules'
import type { PageProps } from '../App'
import type { StoredFile } from '../domain/types'
import { accessLabels } from '../domain/labels'
import './ConsultationPage.css'

const formatDate = (date: string) => date.split('-').reverse().join('/')

export function LibraryPage({ state, setState, viewer, notify }: PageProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptFile, setReceiptFile] = useState<StoredFile | undefined>()
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState('')
  const rows = useMemo(() => state.deposits.filter((deposit) => deposit.status !== 'nao-encaminhado').map((deposit) => {
    const work = state.works.find((item) => item.id === deposit.workId)!
    const board = state.boards.find((item) => item.workId === work.id)
    const term = state.documents.find((item) => item.boardId === board?.id && item.kind === 'autorizacao-ric-cps')?.term
    return { deposit, work, board, term, course: state.courses.find((item) => item.id === work.courseId)?.code }
  }), [state])
  const queue = rows.filter((row) => row.deposit.status === 'encaminhado')
  const registered = rows.filter((row) => row.deposit.status === 'registrado')

  function resetForm() { setReceiptUrl(''); setReceiptFile(undefined); setNote(''); setFormError('') }
  function toggleForm(workId: string) {
    if (openId === workId) { setOpenId(null); resetForm(); return }
    setOpenId(workId); resetForm()
  }
  function cancelForm(workId: string) {
    setOpenId(null); resetForm()
    document.getElementById(`abrir-${workId}`)?.focus()
  }

  function recordSubmission(event: FormEvent<HTMLFormElement>, row: (typeof queue)[number]) {
    event.preventDefault()
    if (!receiptUrl.trim() && !receiptFile) { setFormError('Informe o link do registro no RIC-CPS ou anexe um comprovante.'); return }
    const now = new Date().toISOString()
    const url = receiptUrl.trim() || undefined
    const observation = note.trim() || undefined
    const file = receiptFile
    setState((current) => ({
      ...current,
      deposits: current.deposits.map((item) => item.workId === row.work.id ? { ...item, status: 'registrado', submittedBy: viewer.id, recordedAt: now, receiptUrl: url, receiptFile: file, note: observation } : item),
      history: row.board ? [...current.history, { id: `h-${Date.now().toString(36)}`, boardId: row.board.id, at: now, actorId: viewer.id, label: 'Submetido no RIC-CPS', detail: 'Registro manual do bibliotecário com link ou comprovante (demonstração).' }] : current.history,
    }))
    setOpenId(null); resetForm()
    notify({ kind: 'success', message: 'Submissão registrada (registro local, sem integração). Aparece como depositado na consulta.', undo: true })
  }

  return <>
    <PageHeader title="Depósito no RIC-CPS" description="Pacotes validados pelos orientadores, prontos para registrar." />
    <section className="panel table-panel" aria-labelledby="fila-titulo">
      <div className="panel-heading"><div><h2 id="fila-titulo">Aguardando submissão</h2><p>{queue.length ? `${queue.length} ${queue.length === 1 ? 'pacote' : 'pacotes'} no RIC-CPS por registrar` : 'Nenhum pacote pendente'}</p></div><Library size={18} /></div>
      {queue.length ? <ul className="queue-list">{queue.map((row) => {
        const { deposit, work, board, term, course } = row
        const isOpen = openId === work.id
        return <li key={work.id} className={`queue-item${isOpen ? ' queue-item--open' : ''}`}>
          <div className="queue-item__row">
            <div className="queue-item__title">
              <h3>{work.title}</h3>
              <p>{course} · nota {board?.grade?.toLocaleString('pt-BR') ?? '—'} · {board?.nominatedByBoard ? 'indicado' : 'não indicado'}</p>
            </div>
            <dl className="queue-item__facts">
              <div><dt>Acesso</dt><dd>{term ? accessLabels[term.accessLevel] : '—'}{term?.accessLevel === 'embargo' && term.embargoUntil && <small>até {formatDate(term.embargoUntil)}</small>}</dd></div>
              <div><dt>Prazo</dt><dd>{board ? formatDate(libraryDeadline(board.semester, board.year)) : '—'}<small>Encaminhado em {deposit.sentToLibraryAt ? new Date(deposit.sentToLibraryAt).toLocaleDateString('pt-BR') : '—'}</small></dd></div>
            </dl>
            <button type="button" id={`abrir-${work.id}`} className={`button button--small${isOpen ? '' : ' button--primary'}`} aria-expanded={isOpen} aria-controls={isOpen ? `registro-${work.id}` : undefined} onClick={() => toggleForm(work.id)}>Registrar no RIC-CPS <ChevronDown size={14} className="queue-item__chevron" /></button>
          </div>
          <ul className="package-files" aria-label="Arquivos do pacote">{deposit.packageFiles?.map((name) => <li key={name}><FileText size={12} /> {name}</li>)}{deposit.academicServicesCopy && <li>Cópia do TA à Diretoria de Serviços Acadêmicos</li>}</ul>
          {isOpen && <form id={`registro-${work.id}`} className="queue-form" noValidate aria-label={`Registro no RIC-CPS de ${work.title}`} onSubmit={(event) => recordSubmission(event, row)}>
            <div className="queue-form__fields">
              <label>Link do registro no RIC-CPS<input type="url" value={receiptUrl} onChange={(event) => { setReceiptUrl(event.target.value); setFormError('') }} placeholder="https://..." autoFocus aria-invalid={formError ? true : undefined} /></label>
              <label>Observação (opcional)<input value={note} onChange={(event) => setNote(event.target.value)} /></label>
              <div className="queue-form__file"><FilePicker label="Selecionar comprovante" file={receiptFile} onSelect={(file) => { setReceiptFile(file); setFormError('') }} /></div>
            </div>
            {formError && <p className="queue-form__error" role="alert"><AlertCircle size={14} /> {formError}</p>}
            <div className="queue-form__actions">
              <button type="submit" className="button button--primary"><CheckCircle2 size={16} /> Registrar submissão</button>
              <button type="button" className="button button--quiet" onClick={() => cancelForm(work.id)}>Cancelar</button>
            </div>
          </form>}
        </li>
      })}</ul> : <div className="empty-state"><span><Library size={18} /></span><div><strong>{registered.length ? 'Fila em dia' : 'Nenhum pacote encaminhado'}</strong><p>{registered.length ? 'Todos os pacotes recebidos já foram registrados.' : 'Os pacotes aparecem quando o orientador valida o TA e encaminha à biblioteca.'}</p></div></div>}
      <p className="table-note"><AlertCircle size={14} /> Texto integral só com nota ≥ 9 e indicação da banca (Art. 14); os demais ficam com registro e resumo.</p>
    </section>
    {registered.length > 0 && <section className="registered-section" aria-labelledby="registrados-titulo">
      <h2 id="registrados-titulo">Registrados <span>{registered.length}</span></h2>
      <ul className="registered-list">{registered.map(({ deposit, work, term, course }) => <li key={work.id}>
        <div className="registered-list__main">
          <strong>{work.title}</strong>
          <small>{course} · {term ? accessLabels[term.accessLevel] : 'Acesso não informado'} · registrado em {deposit.recordedAt ? new Date(deposit.recordedAt).toLocaleDateString('pt-BR') : '—'}</small>
        </div>
        <div className="registered-list__proof">
          {deposit.receiptUrl && <a className="inline-link" href={deposit.receiptUrl} target="_blank" rel="noreferrer">Abrir registro <ExternalLink size={12} /></a>}
          {deposit.receiptFile && <small><FileText size={12} /> {deposit.receiptFile.name}</small>}
          {deposit.note && <small>{deposit.note}</small>}
        </div>
      </li>)}</ul>
    </section>}
  </>
}
