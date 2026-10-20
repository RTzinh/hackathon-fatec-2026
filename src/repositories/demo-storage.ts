import { demoState } from '../data/demo-data'
import type { DemoState } from '../domain/types'

/** Chave dos DADOS, compartilhada entre as abas via localStorage. O perfil é por aba (sessionStorage), em App.tsx. */
export const DEMO_STORAGE_KEY = 'sig-banca-demo-v2'

/** Lê um JSON salvo (ou null) e completa o que faltar com o cenário inicial. */
export function parseDemoState(saved: string | null): DemoState {
  try {
    return saved ? { ...demoState, ...JSON.parse(saved) as Partial<DemoState> } : structuredClone(demoState)
  } catch {
    return structuredClone(demoState)
  }
}

export function loadDemoState(): DemoState {
  try {
    return parseDemoState(localStorage.getItem(DEMO_STORAGE_KEY))
  } catch {
    return structuredClone(demoState)
  }
}

/** Grava só quando o JSON mudou. Evita regravar o mesmo valor e disparar o evento `storage` em outras abas à toa. */
export function saveDemoState(state: DemoState): void {
  const json = JSON.stringify(state)
  if (localStorage.getItem(DEMO_STORAGE_KEY) !== json) localStorage.setItem(DEMO_STORAGE_KEY, json)
}

export function resetDemoState(): DemoState {
  localStorage.removeItem(DEMO_STORAGE_KEY)
  return structuredClone(demoState)
}
