import { FireIcon } from '@phosphor-icons/react/Fire'
import { TrophyIcon } from '@phosphor-icons/react/Trophy'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import type { Achievement } from '../../domain/achievements'
import { nextAchievement } from '../../domain/achievements'
import type { Run } from '../../domain/runs'
import { ExpandableStrip, Strip } from '../../ui/design/Strip'
import { AchievementList } from './AchievementList'

function record({ current, best }: Run, t: TFunction): string {
  if (best === 0) return t('today.firstStreak')
  return current === best ? t('today.bestStreakNow') : t('today.bestStreak', { count: best })
}

/** Cuántos días perfectos se llevan seguidos. */
export function PerfectStreak({ run }: { readonly run: Run }) {
  const { t } = useTranslation()

  return (
    <Strip
      heading="h2"
      lead={<FireIcon weight={run.current > 0 ? 'fill' : 'regular'} size={32} aria-hidden />}
      title={t('today.perfectStreak', { count: run.current })}
      details={[record(run, t)]}
    />
  )
}

interface MilestonesProps {
  readonly milestones: readonly Achievement[]
  /** Días perfectos en total, seguidos o no. */
  readonly total: number
}

/** El próximo reto por número de días perfectos; al tocarlo, todos. */
export function Milestones({ milestones, total }: MilestonesProps) {
  const { t } = useTranslation()
  const next = nextAchievement(milestones)
  // Con todo conseguido se sigue enseñando el último.
  const shown = next ?? milestones[milestones.length - 1]
  const target = shown?.days ?? 0

  return (
    <ExpandableStrip
      heading="h2"
      lead={<TrophyIcon weight={next ? 'regular' : 'fill'} size={32} aria-hidden />}
      title={t('today.milestone', { count: target })}
      details={[
        next
          ? t('today.milestoneLeft', { count: next.days - total, reward: next.reward })
          : t('today.allUnlocked'),
      ]}
      progress={{ value: Math.min(total, target), max: target }}
    >
      <AchievementList
        achievements={milestones}
        name={(days) => t('today.milestone', { count: days })}
        value={total}
      />
    </ExpandableStrip>
  )
}
