/** Cambios que hace la persona. Cada uno devuelve datos nuevos o el motivo del rechazo. */
import type { AppData, DayRecord, DayRecords } from './appData'
import { dayEntries } from './appData'
import type { DayKey, Weekday } from './date'
import { weekdayOf } from './date'
import type { Goal, GoalContent, GoalDraft, GoalError, GoalId } from './goal'
import { MAX_GOALS_PER_DAY, normalizeTitle, normalizeWeekdays, titleError } from './goal'
import { activeGoals, reconcile } from './history'

export type ActionResult =
  { readonly ok: true; readonly data: AppData } | { readonly ok: false; readonly error: GoalError }

const accept = (data: AppData): ActionResult => ({ ok: true, data })
const reject = (error: GoalError): ActionResult => ({ ok: false, error })

function cleanDraft(draft: GoalDraft): GoalDraft {
  const content: GoalContent =
    draft.content.kind === 'custom'
      ? { kind: 'custom', title: normalizeTitle(draft.content.title) }
      : draft.content
  return { content, weekdays: normalizeWeekdays(draft.weekdays) }
}

function isSameContent(a: GoalContent, b: GoalContent): boolean {
  if (a.kind === 'preset') return b.kind === 'preset' && a.preset === b.preset
  return b.kind === 'custom' && a.title.toLocaleLowerCase() === b.title.toLocaleLowerCase()
}

/** `others` son las demás metas activas: al editar, la propia meta no cuenta. */
function draftError(draft: GoalDraft, others: readonly Goal[]): GoalError | null {
  if (draft.content.kind === 'custom') {
    const error = titleError(draft.content.title)
    if (error) return error
  }
  if (draft.weekdays.length === 0) return 'no-weekdays'
  if (others.some((goal) => isSameContent(goal.content, draft.content))) return 'duplicate'

  const isFull = (weekday: Weekday) =>
    others.filter((goal) => goal.weekdays.includes(weekday)).length >= MAX_GOALS_PER_DAY
  return draft.weekdays.some(isFull) ? 'day-full' : null
}

function placeInRecord(record: DayRecord, id: GoalId, wanted: boolean): DayRecord {
  const present = record.scheduled.includes(id)
  if (wanted && !present && record.scheduled.length < MAX_GOALS_PER_DAY) {
    return { ...record, scheduled: [...record.scheduled, id] }
  }
  if (!wanted && present) {
    return {
      scheduled: record.scheduled.filter((other) => other !== id),
      done: record.done.filter((other) => other !== id),
    }
  }
  return record
}

/**
 * Pone o quita una meta de hoy en adelante, sin tocar las demás ni los días pasados. Solo hay
 * días posteriores a hoy si el reloj del móvil ha retrocedido.
 */
function placeFromToday(
  days: DayRecords,
  today: DayKey,
  id: GoalId,
  weekdays: readonly Weekday[],
): DayRecords {
  const changes = dayEntries(days)
    .filter(([day]) => day >= today)
    .map(([day, record]) => [day, placeInRecord(record, id, weekdays.includes(weekdayOf(day)))])
  return { ...days, ...(Object.fromEntries(changes) as DayRecords) }
}

export function addGoal(data: AppData, today: DayKey, draft: GoalDraft): ActionResult {
  const clean = cleanDraft(draft)
  const error = draftError(clean, activeGoals(data))
  if (error) return reject(error)

  const current = reconcile(data, today)
  const goal: Goal = { id: `g${current.nextGoalNumber}`, ...clean, removedOn: null }
  return accept({
    goals: [goal, ...current.goals],
    days: placeFromToday(current.days, today, goal.id, goal.weekdays),
    nextGoalNumber: current.nextGoalNumber + 1,
  })
}

export function updateGoal(
  data: AppData,
  today: DayKey,
  id: GoalId,
  draft: GoalDraft,
): ActionResult {
  const active = activeGoals(data)
  if (!active.some((goal) => goal.id === id)) return reject('not-found')

  const clean = cleanDraft(draft)
  const error = draftError(
    clean,
    active.filter((goal) => goal.id !== id),
  )
  if (error) return reject(error)

  const current = reconcile(data, today)
  return accept({
    ...current,
    goals: current.goals.map((goal) => (goal.id === id ? { ...goal, ...clean } : goal)),
    days: placeFromToday(current.days, today, id, clean.weekdays),
  })
}

/** Quita la meta desde hoy, aunque hoy ya estuviera marcada. El pasado no cambia. */
export function removeGoal(data: AppData, today: DayKey, id: GoalId): ActionResult {
  if (!activeGoals(data).some((goal) => goal.id === id)) return reject('not-found')

  const current = reconcile(data, today)
  return accept({
    ...current,
    goals: current.goals.map((goal) => (goal.id === id ? { ...goal, removedOn: today } : goal)),
    days: placeFromToday(current.days, today, id, []),
  })
}

/** Marca o desmarca una meta de hoy. Los días pasados no se pueden editar. */
export function toggleGoal(data: AppData, today: DayKey, id: GoalId): ActionResult {
  if (!data.goals.some((goal) => goal.id === id)) return reject('not-found')

  const current = reconcile(data, today)
  const record = current.days[today]
  if (!record?.scheduled.includes(id)) return reject('not-scheduled')

  const done = record.done.includes(id)
    ? record.done.filter((other) => other !== id)
    : [...record.done, id]
  return accept({ ...current, days: { ...current.days, [today]: { ...record, done } } })
}
