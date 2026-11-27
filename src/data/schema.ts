/** Forma exacta de lo que se guarda. Nada entra en la app sin pasar por aquí. */
import { z } from 'zod'
import type { DayKey } from '../domain/date'
import { parseDayKey, WEEKDAYS } from '../domain/date'
import type { GoalId } from '../domain/goal'
import { MAX_GOALS_PER_DAY, normalizeTitle, PRESET_IDS, titleError } from '../domain/goal'

// La política de seguridad de contenido prohíbe evaluar código, y zod lo haría para acelerar.
// Debe configurarse antes de definir los esquemas.
z.config({ jitless: true })

export const SCHEMA_VERSION = 1

const dayKey = z.custom<DayKey>((value) => typeof value === 'string' && parseDayKey(value) !== null)

const goalId = z.custom<GoalId>(
  (value) => typeof value === 'string' && /^g[1-9]\d{0,8}$/.test(value),
)

const hasNoRepeats = (values: readonly unknown[]) => new Set(values).size === values.length

const goalIds = z.array(goalId).max(MAX_GOALS_PER_DAY).refine(hasNoRepeats)

const content = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('preset'), preset: z.enum(PRESET_IDS) }),
  z.strictObject({
    kind: z.literal('custom'),
    title: z
      .string()
      .refine((title) => normalizeTitle(title) === title && titleError(title) === null),
  }),
])

const weekdays = z
  .array(z.literal(WEEKDAYS))
  .min(1)
  .refine((days) => days.every((day, index) => (days[index - 1] ?? 0) < day))

const goal = z.strictObject({
  id: goalId,
  content,
  weekdays,
  removedOn: dayKey.nullable(),
})

const dayRecord = z
  .strictObject({ scheduled: goalIds, done: goalIds })
  .refine(({ scheduled, done }) => done.every((id) => scheduled.includes(id)))

/** Lo mínimo para saber con qué versión se guardó un documento. */
export const headerSchema = z.looseObject({ schemaVersion: z.int().min(1) })

export const documentSchema = z
  .strictObject({
    schemaVersion: z.literal(SCHEMA_VERSION),
    goals: z.array(goal),
    days: z.record(dayKey, dayRecord),
    nextGoalNumber: z.int().min(1),
  })
  .refine(({ goals, days, nextGoalNumber }) => {
    const known = new Set(goals.map(({ id }) => id))
    return (
      known.size === goals.length &&
      goals.every(({ id }) => Number(id.slice(1)) < nextGoalNumber) &&
      Object.values(days).every(({ scheduled }) => scheduled.every((id) => known.has(id)))
    )
  })
