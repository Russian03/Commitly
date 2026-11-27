import { CaretRightIcon } from '@phosphor-icons/react/CaretRight'
import { useTranslation } from 'react-i18next'
import { useNavigator } from '../../app/navigator'
import type { Goal } from '../../domain/goal'
import { goalName, scheduleSummary } from '../tasks/goalText'
import { illustrationFor } from '../tasks/illustrations'
import styles from './GoalRow.module.css'

/** Una meta de la lista. Sus cambios se hacen en su ficha y se confirman al guardar. */
export function GoalRow({ goal }: { readonly goal: Goal }) {
  const { t, i18n } = useTranslation()
  const navigator = useNavigator()

  return (
    <button
      type="button"
      className={styles.open}
      onClick={() => {
        navigator.open({ kind: 'edit', id: goal.id })
      }}
    >
      <span className={styles.art}>
        <img src={illustrationFor(goal.content)} alt="" draggable={false} />
      </span>
      <span className={styles.text}>
        <span className={styles.name}>{goalName(goal.content, t)}</span>{' '}
        <span className={styles.days}>{scheduleSummary(goal.weekdays, t, i18n.language)}</span>
      </span>
      <CaretRightIcon weight="light" size={22} aria-hidden />
    </button>
  )
}
