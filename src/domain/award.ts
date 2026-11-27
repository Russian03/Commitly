import type { Achievement } from './achievements'
import { achievements, GOAL_REWARD_PER_DAY, PERFECT_REWARD_PER_DAY } from './achievements'
import type { AppData } from './appData'
import type { DayKey } from './date'
import { addDays } from './date'
import { experience } from './experience'
import type { Goal } from './goal'
import { activeGoals } from './history'
import type { LevelProgress } from './points'
import { levelProgress } from './points'
import type { Run } from './runs'
import { goalRun, perfectRun } from './runs'
import type { DaySummary } from './summary'
import { summarizeDay } from './summary'

/** Cómo va el día: sin metas, día libre, sin empezar, a medias o completo. */
export type AwardState = 'no-goals' | 'rest' | 'pending' | 'partial' | 'perfect'

export interface GoalProgress {
  readonly goal: Goal
  readonly run: Run
  readonly achievements: readonly Achievement[]
}

export interface Award {
  readonly state: AwardState
  readonly day: DaySummary
  /** Lo que lleva ganado hoy, con logros incluidos. */
  readonly earned: number
  /** Puntos que ya cuentan para el nivel. */
  readonly points: number
  /** Puntos de ayer que aún no se han sumado. */
  readonly pending: number
  readonly progress: LevelProgress
  readonly perfect: Run
  /** Logros por número de días perfectos en total. */
  readonly milestones: readonly Achievement[]
  /** Una por cada meta activa, toque hoy o no. */
  readonly goals: readonly GoalProgress[]
}

function stateOf(day: DaySummary, hasGoals: boolean): AwardState {
  if (day.rest) return hasGoals ? 'rest' : 'no-goals'
  if (day.perfect) return 'perfect'
  return day.done > 0 ? 'partial' : 'pending'
}

/** Todo lo que enseñan los galardones. `credited` es el último día cuyos puntos ya cuentan. */
export function todayAward(data: AppData, today: DayKey, credited: DayKey): Award {
  const day = summarizeDay(data.days[today] ?? { scheduled: [], done: [] })
  const goals = activeGoals(data)
  const yesterday = addDays(today, -1)
  const upToYesterday = experience(data, yesterday)
  const points = credited === yesterday ? upToYesterday : experience(data, credited)
  const perfect = perfectRun(data, today)
  return {
    state: stateOf(day, goals.length > 0),
    day,
    earned: experience(data, today) - upToYesterday,
    points,
    pending: upToYesterday - points,
    progress: levelProgress(points),
    perfect,
    milestones: achievements(perfect.total, PERFECT_REWARD_PER_DAY),
    goals: goals.map((goal) => {
      const run = goalRun(data, today, goal.id)
      return { goal, run, achievements: achievements(run.best, GOAL_REWARD_PER_DAY) }
    }),
  }
}
