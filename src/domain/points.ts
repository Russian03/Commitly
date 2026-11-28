import type { AppData } from './appData'
import { dayEntries } from './appData'
import type { DayKey } from './date'
import { addDays, toDayKey } from './date'

/** Hora de la mañana a la que se suman al nivel los puntos del día anterior. */
export const POINTS_HOUR = 8

const POINTS_PER_GOAL = 10
const PERFECT_BONUS_PER_GOAL = 5
/** Subir del nivel L al L+1 cuesta `LEVEL_STEP × L` puntos. */
const LEVEL_STEP = 100

export function dayPoints(done: number, total: number): number {
  const bonus = total > 0 && done === total ? total * PERFECT_BONUS_PER_GOAL : 0
  return done * POINTS_PER_GOAL + bonus
}

/** El último día cuyos puntos ya cuentan en este momento. */
export function creditedThrough(now: Date): DayKey {
  return addDays(toDayKey(now), now.getHours() >= POINTS_HOUR ? -1 : -2)
}

/** Los puntos de todos los días hasta `through`, incluido. */
export function totalPoints(data: AppData, through: DayKey): number {
  return dayEntries(data.days)
    .filter(([day]) => day <= through)
    .reduce((sum, [, { done, scheduled }]) => sum + dayPoints(done.length, scheduled.length), 0)
}

export interface LevelProgress {
  readonly level: number
  /** Puntos conseguidos dentro del nivel actual. */
  readonly current: number
  /** Puntos que pide el nivel actual para pasar al siguiente. */
  readonly required: number
}

export function levelProgress(points: number): LevelProgress {
  let level = 1
  let current = points
  while (current >= level * LEVEL_STEP) {
    current -= level * LEVEL_STEP
    level += 1
  }
  return { level, current, required: level * LEVEL_STEP }
}
