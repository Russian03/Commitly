import type { AppData, DayRecord } from './appData'
import { dayEntries } from './appData'
import type { DayKey } from './date'
import { addDays } from './date'
import type { GoalId } from './goal'
import { summarizeDay } from './summary'

export interface Run {
  /** Días seguidos hasta el día consultado. */
  readonly current: number
  /** La serie más larga que ha habido. */
  readonly best: number
  /** Días cumplidos en total, seguidos o no. */
  readonly total: number
}

/** Qué es un día para lo que se cuenta: cumplido, fallado o que no tocaba. */
type Verdict = 'hit' | 'miss' | 'off'

/**
 * Recorre el historial hasta `through`. Un día que no tocaba no suma ni rompe la serie, el propio
 * `through` sin cumplir tampoco la rompe (aún se está a tiempo) y un hueco sin registrar sí.
 */
function follow(data: AppData, through: DayKey, judge: (record: DayRecord) => Verdict): Run {
  const history = dayEntries(data.days)
    .filter(([day]) => day <= through)
    .sort(([a], [b]) => a.localeCompare(b))

  let current = 0
  let best = 0
  let total = 0
  let expected: DayKey | null = null
  for (const [day, record] of history) {
    if (expected !== null && day !== expected) current = 0
    expected = addDays(day, 1)

    const verdict = judge(record)
    if (verdict === 'hit') {
      current += 1
      total += 1
      best = Math.max(best, current)
    } else if (verdict === 'miss' && day !== through) {
      current = 0
    }
  }
  // Si el historial acaba antes de ayer, la serie ya se cortó.
  if (expected !== null && expected < through) current = 0
  return { current, best, total }
}

/** La serie de una meta: los días que tocaba y se cumplió. */
export function goalRun(data: AppData, through: DayKey, id: GoalId): Run {
  return follow(data, through, ({ scheduled, done }) => {
    if (done.includes(id)) return 'hit'
    return scheduled.includes(id) ? 'miss' : 'off'
  })
}

/** La serie de días perfectos: los que se cumplió todo. */
export function perfectRun(data: AppData, through: DayKey): Run {
  return follow(data, through, (record) => {
    const { perfect, rest } = summarizeDay(record)
    if (perfect) return 'hit'
    return rest ? 'off' : 'miss'
  })
}
