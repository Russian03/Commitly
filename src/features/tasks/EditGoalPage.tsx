import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigator } from '../../app/navigator'
import type { GoalId } from '../../domain/goal'
import { activeGoals } from '../../domain/history'
import { useApp } from '../../state/context'
import { Button } from '../../ui/design/Button'
import { Confirm } from '../../ui/design/Confirm'
import { GoalForm } from './GoalForm'
import styles from './EditGoalPage.module.css'

export function EditGoalPage({ id }: { readonly id: GoalId }) {
  const { t } = useTranslation()
  const navigator = useNavigator()
  const goal = useApp((state) => activeGoals(state.data).find((other) => other.id === id) ?? null)
  const updateGoal = useApp((state) => state.updateGoal)
  const removeGoal = useApp((state) => state.removeGoal)
  const [removing, setRemoving] = useState(false)

  // Justo después de quitarla, mientras la página se cierra.
  if (!goal) return null

  return (
    <GoalForm
      heading={t('form.editTitle')}
      submitLabel={t('form.save')}
      content={goal.content}
      weekdays={goal.weekdays}
      onSubmit={(draft) => updateGoal(id, draft)}
    >
      <div className={styles.remove}>
        {removing ? (
          <Confirm
            question={t('form.removeQuestion')}
            confirmLabel={t('form.removeConfirm')}
            cancelLabel={t('form.cancel')}
            onConfirm={() => {
              removeGoal(id)
              navigator.close()
            }}
            onCancel={() => {
              setRemoving(false)
            }}
          />
        ) : (
          <Button
            variant="quiet"
            onClick={() => {
              setRemoving(true)
            }}
          >
            {t('form.remove')}
          </Button>
        )}
      </div>
    </GoalForm>
  )
}
