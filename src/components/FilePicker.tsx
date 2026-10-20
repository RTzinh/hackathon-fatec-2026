import { useId } from 'react'
import { FileText, Upload } from 'lucide-react'
import { inspectPdfBytes } from '../domain/rules'
import type { PdfInspection, StoredFile } from '../domain/types'

const FULL_READ_LIMIT = 24 * 1_048_576
const EDGE_READ = 4 * 1_048_576

/** Lê início e fim do arquivo no navegador; nenhum byte sai da máquina. */
async function inspectFile(file: File): Promise<PdfInspection | undefined> {
  try {
    if (file.size <= FULL_READ_LIMIT) return inspectPdfBytes(new Uint8Array(await file.arrayBuffer()))
    const head = new Uint8Array(await file.slice(0, EDGE_READ).arrayBuffer())
    const tail = new Uint8Array(await file.slice(file.size - EDGE_READ).arrayBuffer())
    const joined = new Uint8Array(head.length + tail.length)
    joined.set(head); joined.set(tail, head.length)
    return inspectPdfBytes(joined)
  } catch {
    return undefined
  }
}

export function FilePicker({ label, accept = '.pdf,.pdfa,application/pdf', file, onSelect }: { label: string; accept?: string; file?: StoredFile; onSelect: (file: StoredFile) => void }) {
  const id = useId()
  return <div className="file-picker">
    <input id={id} type="file" accept={accept} onChange={async (event) => {
      const input = event.currentTarget
      const selected = input.files?.[0]
      if (!selected) return
      const inspection = await inspectFile(selected)
      onSelect({ name: selected.name, type: selected.type || 'Tipo não informado pelo navegador', size: selected.size, selectedAt: new Date().toISOString(), persistence: 'metadados-locais', inspection })
      input.value = ''
    }} />
    <label htmlFor={id} className="file-picker__button"><Upload size={15} /> {label}</label>
    {file ? <div className="file-meta"><span className="file-meta__icon"><FileText size={16} /></span><div><strong>{file.name}</strong><span>{file.type} · {formatSize(file.size)}{file.inspection && ` · ${file.inspection.pdfaPart ? `PDF/A-${file.inspection.pdfaPart} declarado` : file.inspection.isPdf ? 'PDF sem declaração PDF/A' : 'não é PDF'}`}</span></div><span className="file-meta__state">Metadados salvos</span></div>
      : <p className="file-picker__empty">Nenhum arquivo selecionado.</p>}
    <p className="file-picker__note">O conteúdo é lido só neste navegador para checar formato; persistem nome, tipo, tamanho e resultado da checagem. Nenhum arquivo é enviado a um servidor.</p>
  </div>
}

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}
