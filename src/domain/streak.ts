import type { AppData } from './appData'
import type { DayKey } from './date'
import { addDays } from './date'
import { summarizeDay } from './summary'

/**
 * Días perfectos seguidos hasta hoy. Un día libre no suma ni rompe la racha, y hoy sin
 * terminar tampoco la rompe.
 */
export function currentStreak(data: AppData, today: DayKey): number {
  const todayRecord = data.days[today]
  let streak = todayRecord && summarizeDay(todayRecord).perfect ? 1 : 0

  let day = addDays(today, -1)
  for (let record = data.days[day]; record; record = data.days[day]) {
    const { perfect, rest } = summarizeDay(record)
    if (!perfect && !rest) break
    if (perfect) streak += 1
    day = addDays(day, -1)
  }
  return streak
}
