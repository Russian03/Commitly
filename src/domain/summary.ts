import type { DayRecord } from './appData'
import type { ColorLevel } from './level'
import { colorLevel } from './level'
import { dayPoints } from './points'

export interface DaySummary {
  readonly total: number
  readonly done: number
  readonly level: ColorLevel
  readonly points: number
  /** Todas las metas del día cumplidas. */
  readonly perfect: boolean
  /** Día libre: no tocaba ninguna meta. */
  readonly rest: boolean
}

export function summarizeDay(record: DayRecord): DaySummary {
  const total = record.scheduled.length
  const done = record.done.length
  return {
    total,
    done,
    level: colorLevel(done, total),
    points: dayPoints(done, total),
    perfect: total > 0 && done === total,
    rest: total === 0,
  }
}
