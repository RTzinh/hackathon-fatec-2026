import { useId } from 'react'
import { FileText, Upload } from 'lucide-react'
import type { StoredFile } from '../domain/types'

export function FilePicker({ label, accept = '.pdf,.pdfa,application/pdf', file, onSelect }: { label: string; accept?: string; file?: StoredFile; onSelect: (file: StoredFile) => void }) {
  const id = useId()
  return <div className="file-picker">
    <input id={id} type="file" accept={accept} onChange={(event) => {
      const selected = event.currentTarget.files?.[0]
      if (!selected) return
      onSelect({ name: selected.name, type: selected.type || 'Tipo não informado pelo navegador', size: selected.size, selectedAt: new Date().toISOString(), persistence: 'metadados-locais' })
      event.currentTarget.value = ''
    }} />
    <label htmlFor={id} className="file-picker__button"><Upload size={15} /> {label}</label>
    {file ? <div className="file-meta"><span className="file-meta__icon"><FileText size={16} /></span><div><strong>{file.name}</strong><span>{file.type} · {formatSize(file.size)}</span></div><span className="file-meta__state">Metadados salvos</span></div>
      : <p className="file-picker__empty">Nenhum arquivo selecionado.</p>}
    <p className="file-picker__note">O arquivo fica nesta sessão do navegador; nome, tipo e tamanho persistem. Nenhum arquivo é enviado a um servidor.</p>
  </div>
}

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}
