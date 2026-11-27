import { useTranslation } from 'react-i18next'
import type { Weekday } from '../../domain/date'
import { WEEKDAYS } from '../../domain/date'
import { weekdayName } from './goalText'
import styles from './WeekdayPicker.module.css'

interface Props {
  readonly selected: readonly Weekday[]
  readonly onChange: (selected: Weekday[]) => void
}

export function WeekdayPicker({ selected, onChange }: Props) {
  const { t, i18n } = useTranslation()

  const toggle = (day: Weekday) => {
    onChange(WEEKDAYS.filter((other) => selected.includes(other) !== (other === day)))
  }

  return (
    <fieldset className={styles.field}>
      <legend className={styles.legend}>{t('form.days')}</legend>
      <div className={styles.days}>
        {WEEKDAYS.map((day) => (
          <button
            key={day}
            type="button"
            className={styles.day}
            aria-label={weekdayName(day, i18n.language, 'long')}
            aria-pressed={selected.includes(day)}
            onClick={() => {
              toggle(day)
            }}
          >
            {weekdayName(day, i18n.language, 'narrow')}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
