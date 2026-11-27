import type { DayKey, Weekday } from './date'

/** Metas de ejemplo, en el orden del catálogo. Sus nombres se traducen en la interfaz. */
export const PRESET_IDS = ['read', 'study', 'exercise', 'water', 'meditate', 'sleep'] as const

export type PresetId = (typeof PRESET_IDS)[number]

/** Tope de metas en un mismo día, para que los puntos no se puedan inflar. */
export const MAX_GOALS_PER_DAY = 12

export const MAX_TITLE_LENGTH = 40

export type GoalId = `g${number}`

export type GoalContent =
  | { readonly kind: 'preset'; readonly preset: PresetId }
  | { readonly kind: 'custom'; readonly title: string }

export interface Goal {
  readonly id: GoalId
  readonly content: GoalContent
  readonly weekdays: readonly Weekday[]
  /** Las metas quitadas se archivan: el historial sigue pudiendo nombrarlas. */
  readonly removedOn: DayKey | null
}

/** Lo que la persona elige al crear o editar una meta. */
export interface GoalDraft {
  readonly content: GoalContent
  readonly weekdays: readonly Weekday[]
}

export type GoalError =
  | 'title-empty'
  | 'title-too-long'
  | 'no-weekdays'
  | 'duplicate'
  | 'day-full'
  | 'not-found'
  | 'not-scheduled'

export function normalizeTitle(title: string): string {
  return title
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function titleError(title: string): 'title-empty' | 'title-too-long' | null {
  // Un título hecho solo de caracteres invisibles cuenta como vacío.
  if (!/[^\p{Cf}\p{Z}\s]/u.test(title)) return 'title-empty'
  // `Array.from` cuenta caracteres completos: un emoji simple es uno, no dos.
  return Array.from(title).length > MAX_TITLE_LENGTH ? 'title-too-long' : null
}

export function normalizeWeekdays(weekdays: readonly Weekday[]): Weekday[] {
  return [...new Set(weekdays)].sort((a, b) => a - b)
}
