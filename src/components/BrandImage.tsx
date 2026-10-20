import { useState } from 'react'
import type { ReactNode } from 'react'

/** Imagem de marca de `public/brand/`. Se o arquivo não existir ou falhar, mostra o `fallback`. */
export function BrandImage({ file, className, fallback, alt = '' }: { file: string; className?: string; fallback: ReactNode; alt?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <>{fallback}</>
  return <img className={className} src={`${import.meta.env.BASE_URL}brand/${file}`} alt={alt} onError={() => setFailed(true)} draggable={false} />
}
