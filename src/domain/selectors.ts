import type { AppData } from './appData'
import type { DayKey } from './date'
import type { Goal } from './goal'
import { activeGoals } from './history'

export interface DayGoal {
  readonly goal: Goal
  readonly done: boolean
}

/** Las metas que tocaban un día, las más nuevas primero. */
export function goalsForDay(data: AppData, day: DayKey): DayGoal[] {
  const record = data.days[day]
  if (!record) return []
  return data.goals
    .filter((goal) => record.scheduled.includes(goal.id))
    .map((goal) => ({ goal, done: record.done.includes(goal.id) }))
}

/** Las metas activas que ese día no tocan. */
export function goalsNotOnDay(data: AppData, day: DayKey): Goal[] {
  const scheduled = data.days[day]?.scheduled ?? []
  return activeGoals(data).filter((goal) => !scheduled.includes(goal.id))
}
