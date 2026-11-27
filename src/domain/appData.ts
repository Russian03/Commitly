import type { DayKey } from './date'
import type { Goal, GoalId } from './goal'

/** Foto de un día: qué metas tocaban y cuáles se cumplieron. */
export interface DayRecord {
  readonly scheduled: readonly GoalId[]
  readonly done: readonly GoalId[]
}

export type DayRecords = Readonly<Partial<Record<DayKey, DayRecord>>>

/** Todo lo que la app guarda. Los puntos, la racha y los colores se calculan a partir de esto. */
export interface AppData {
  /** Las más nuevas primero, incluidas las archivadas. */
  readonly goals: readonly Goal[]
  readonly days: DayRecords
  readonly nextGoalNumber: number
}

export function createEmptyData(): AppData {
  return { goals: [], days: {}, nextGoalNumber: 1 }
}

export function recordedDays(data: AppData): DayKey[] {
  return (Object.keys(data.days) as DayKey[]).sort()
}

/** Cada día registrado con su foto, sin orden garantizado. */
export function dayEntries(days: DayRecords): [DayKey, DayRecord][] {
  return Object.entries(days) as [DayKey, DayRecord][]
}
