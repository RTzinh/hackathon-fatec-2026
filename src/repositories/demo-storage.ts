import { demoState } from '../data/demo-data'
import type { DemoState } from '../domain/types'

const STORAGE_KEY = 'sig-banca-demo-v1'

export function loadDemoState(): DemoState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...demoState, ...JSON.parse(saved) as Partial<DemoState> } : structuredClone(demoState)
  } catch {
    return structuredClone(demoState)
  }
}

export function saveDemoState(state: DemoState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetDemoState(): DemoState {
  localStorage.removeItem(STORAGE_KEY)
  return structuredClone(demoState)
}
