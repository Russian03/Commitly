import type { TFunction } from 'i18next'
import type { Weekday } from '../../domain/date'
import type { GoalContent } from '../../domain/goal'
import { capitalize } from '../../i18n/capitalize'

export function goalName(content: GoalContent, t: TFunction): string {
  return content.kind === 'preset' ? t(`goals.presets.${content.preset}`) : content.title
}

export function weekdayName(
  day: Weekday,
  language: string,
  width: 'narrow' | 'short' | 'long',
): string {
  // El 1 de enero de 2024 fue lunes, así que el día N del mes es el día N de la semana.
  const name = new Intl.DateTimeFormat(language, { weekday: width }).format(new Date(2024, 0, day))
  return capitalize(name, language)
}

export function scheduleSummary(
  weekdays: readonly Weekday[],
  t: TFunction,
  language: string,
): string {
  const days = weekdays.join('')
  if (days === '1234567') return t('schedule.everyDay')
  if (days === '12345') return t('schedule.weekdays')
  if (days === '67') return t('schedule.weekend')
  const names = weekdays.map((day) =>
    weekdayName(day, language, 'short').toLocaleLowerCase(language),
  )
  return capitalize(names.join(', '), language)
}
