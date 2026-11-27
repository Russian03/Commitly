/** Utilidades para construir datos en las pruebas. */
import type { ActionResult } from './actions'
import type { AppData, DayRecord } from './appData'
import { createEmptyData } from './appData'
import type { Weekday } from './date'
import type { GoalDraft, GoalId, PresetId } from './goal'

export const EVERY_DAY: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7]

export function dataWith(overrides: Partial<AppData>): AppData {
  return { ...createEmptyData(), ...overrides }
}

export function record(scheduled: GoalId[], done: GoalId[] = []): DayRecord {
  return { scheduled, done }
}

export function preset(id: PresetId, weekdays: readonly Weekday[] = EVERY_DAY): GoalDraft {
  return { content: { kind: 'preset', preset: id }, weekdays }
}

export function custom(title: string, weekdays: readonly Weekday[] = EVERY_DAY): GoalDraft {
  return { content: { kind: 'custom', title }, weekdays }
}

export function unwrap(result: ActionResult): AppData {
  if (!result.ok) throw new Error(`La acción falló: ${result.error}`)
  return result.data
}
