import { useTranslation } from 'react-i18next'
import { nextAchievement } from '../../domain/achievements'
import type { GoalProgress } from '../../domain/award'
import { ExpandableStrip } from '../../ui/design/Strip'
import { goalName } from '../tasks/goalText'
import { illustrationFor } from '../tasks/illustrations'
import { AchievementList } from './AchievementList'

/** Una meta con la racha que lleva; al tocarla, sus logros. */
export function GoalStrip({ goal, run, achievements }: GoalProgress) {
  const { t } = useTranslation()
  const next = nextAchievement(achievements)

  return (
    <ExpandableStrip
      heading="h3"
      lead={<img src={illustrationFor(goal.content)} alt="" draggable={false} />}
      title={goalName(goal.content, t)}
      details={[
        run.current > 0 ? t('today.streakDays', { count: run.current }) : t('today.noStreak'),
      ]}
      progress={next ? { value: run.current, max: next.days } : { value: 1, max: 1 }}
    >
      <AchievementList
        achievements={achievements}
        name={(days) => t('today.streakDays', { count: days })}
        value={run.current}
      />
    </ExpandableStrip>
  )
}
