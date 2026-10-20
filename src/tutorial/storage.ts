/** Perfis que já viram (ou dispensaram) o tour, guardados só neste navegador. */
export const TOUR_SEEN_KEY = 'integrae-tour-seen-v1'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface SeenStore {
  read(): string[]
  /** Registra o perfil e devolve a lista atualizada, mesmo que o navegador recuse gravar. */
  add(role: string): string[]
}

/**
 * `getStorage` roda dentro de try/catch: em janela privada ou com dados bloqueados, até acessar
 * `localStorage` pode lançar. Nesse caso o tour funciona e lembra o que foi visto só até recarregar.
 */
export function createSeenStore(getStorage: () => StorageLike | null | undefined): SeenStore {
  const session = new Set<string>()

  function stored(): string[] {
    try {
      const raw = getStorage()?.getItem(TOUR_SEEN_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
    } catch {
      return []
    }
  }

  function read(): string[] {
    return [...new Set([...stored(), ...session])]
  }

  return {
    read,
    add(role) {
      session.add(role)
      const next = read()
      try { getStorage()?.setItem(TOUR_SEEN_KEY, JSON.stringify(next)) } catch { /* sem armazenamento: vale só nesta sessão */ }
      return next
    },
  }
}
