import type { AppData } from './appData'
import { dayEntries } from './appData'
import type { DayKey } from './date'

const POINTS_PER_GOAL = 10
const PERFECT_BONUS_PER_GOAL = 5
/** Subir del nivel L al L+1 cuesta `LEVEL_STEP × L` puntos. */
const LEVEL_STEP = 100

export function dayPoints(done: number, total: number): number {
  const bonus = total > 0 && done === total ? total * PERFECT_BONUS_PER_GOAL : 0
  return done * POINTS_PER_GOAL + bonus
}

export function totalPoints(data: AppData, today: DayKey): number {
  return dayEntries(data.days)
    .filter(([day]) => day <= today)
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
