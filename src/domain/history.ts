import type { AppData, DayRecords } from './appData'
import { recordedDays } from './appData'
import type { DayKey } from './date'
import { addDays, daysBetween, weekdayOf } from './date'
import type { Goal, GoalId } from './goal'
import { MAX_GOALS_PER_DAY } from './goal'

/** Unos tres años. Evita generar historial sin fin si el reloj del móvil salta al futuro. */
export const MAX_BACKFILL_DAYS = 1100

export function activeGoals(data: AppData): Goal[] {
  return data.goals.filter((goal) => goal.removedOn === null)
}

function scheduledOn(goals: readonly Goal[], day: DayKey): GoalId[] {
  const weekday = weekdayOf(day)
  return goals
    .filter((goal) => goal.weekdays.includes(weekday))
    .slice(0, MAX_GOALS_PER_DAY)
    .map((goal) => goal.id)
}

function firstDayToFill(data: AppData, today: DayKey): DayKey {
  const previous = recordedDays(data)
    .filter((day) => day < today)
    .pop()
  if (!previous) return today
  return daysBetween(previous, today) > MAX_BACKFILL_DAYS
    ? addDays(today, 1 - MAX_BACKFILL_DAYS)
    : addDays(previous, 1)
}

/**
 * Registra los días pendientes hasta hoy con las metas activas. Se llama al abrir la app, al
 * cambiar de día y antes de cualquier cambio, así que las metas nuevas nunca repintan el pasado.
 * No modifica ni borra días ya registrados, aunque el reloj del móvil haya retrocedido.
 */
export function reconcile(data: AppData, today: DayKey): AppData {
  if (data.days[today]) return data

  const goals = activeGoals(data)
  const days: { -readonly [K in keyof DayRecords]: DayRecords[K] } = { ...data.days }
  for (let day = firstDayToFill(data, today); day <= today; day = addDays(day, 1)) {
    days[day] = { scheduled: scheduledOn(goals, day), done: [] }
  }
  return { ...data, days }
}
