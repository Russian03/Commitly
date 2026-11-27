/** Utilidades para las pruebas de la capa de datos. */
import type { AppData } from '../domain/appData'
import type { KeyValueStorage } from './storage'

export const SAMPLE: AppData = {
  goals: [
    { id: 'g2', content: { kind: 'custom', title: 'Pintar' }, weekdays: [1, 5], removedOn: null },
    {
      id: 'g1',
      content: { kind: 'preset', preset: 'read' },
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      removedOn: '2026-11-27',
    },
  ],
  days: {
    '2026-11-26': { scheduled: ['g1'], done: ['g1'] },
    '2026-11-27': { scheduled: ['g2'], done: [] },
  },
  nextGoalNumber: 3,
}

export interface MemoryStorage extends KeyValueStorage {
  readonly entries: Map<string, string>
}

export function memoryStorage(initial: Record<string, string> = {}): MemoryStorage {
  const entries = new Map(Object.entries(initial))
  return {
    entries,
    get: (key) => Promise.resolve(entries.get(key) ?? null),
    set: (key, value) => {
      entries.set(key, value)
      return Promise.resolve()
    },
  }
}
