import { achievementPoints, GOAL_REWARD_PER_DAY, PERFECT_REWARD_PER_DAY } from './achievements'
import type { AppData } from './appData'
import type { DayKey } from './date'
import { totalPoints } from './points'
import { goalRun, perfectRun } from './runs'

/**
 * Todo lo que cuenta para el nivel hasta `through`: los puntos de cada día y los de los logros,
 * también los de metas ya quitadas. Solo puede crecer al avanzar los días.
 */
export function experience(data: AppData, through: DayKey): number {
  // Los logros miran la mejor serie: romperla no quita lo ya ganado.
  const fromGoals = data.goals.reduce(
    (sum, { id }) => sum + achievementPoints(goalRun(data, through, id).best, GOAL_REWARD_PER_DAY),
    0,
  )
  const fromPerfectDays = achievementPoints(perfectRun(data, through).total, PERFECT_REWARD_PER_DAY)
  return totalPoints(data, through) + fromGoals + fromPerfectDays
}
