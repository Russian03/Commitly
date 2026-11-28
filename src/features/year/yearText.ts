import type { TFunction } from 'i18next'
import { toLocalDate } from '../../domain/date'
import type { YearCell } from '../../domain/year'
import { capitalize } from '../../i18n/capitalize'

export interface DayText {
  /** La fecha, sin el año: ya está en el título de la pantalla. */
  readonly title: string
  /** Siempre dos líneas, para que el detalle no cambie de alto al elegir otro día. */
  readonly details: readonly [string, string]
}

/** Cuenta cómo fue un día. Los formatos de fecha se crean una vez para los 365. */
export function dayDescriber(t: TFunction, language: string): (cell: YearCell) => DayText {
  const date = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long' })
  const weekday = new Intl.DateTimeFormat(language, { weekday: 'long' })

  return ({ day, timing, summary }) => {
    const local = toLocalDate(day)
    const title = date.format(local)
    const when = timing === 'today' ? t('year.today') : capitalize(weekday.format(local), language)

    if (timing === 'future') return { title, details: [when, t('year.future')] }
    if (!summary) return { title, details: [when, t('year.noRecord')] }
    if (summary.rest) return { title, details: [when, t('today.state.rest')] }

    const { done, total, level, perfect } = summary
    const progress = `${when} · ${t('today.progress', { done, count: total })}`
    if (level === 0) return { title, details: [progress, t('year.noColor')] }
    const green = t(perfect ? 'year.perfectGreen' : 'year.green', { level })
    return { title, details: [progress, green] }
  }
}
