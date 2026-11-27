import { useTranslation } from 'react-i18next'
import { WEEKDAYS } from '../../domain/date'
import type { PresetId } from '../../domain/goal'
import { useApp } from '../../state/context'
import { GoalForm } from './GoalForm'

export function CreateGoalPage({ preset }: { readonly preset: PresetId | null }) {
  const { t } = useTranslation()
  const addGoal = useApp((state) => state.addGoal)

  return (
    <GoalForm
      heading={t('form.createTitle')}
      submitLabel={t('form.add')}
      content={preset ? { kind: 'preset', preset } : { kind: 'custom', title: '' }}
      weekdays={WEEKDAYS}
      onSubmit={addGoal}
    />
  )
}
