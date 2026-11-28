import { CheckCircleIcon } from '@phosphor-icons/react/CheckCircle'
import { LockSimpleIcon } from '@phosphor-icons/react/LockSimple'
import { useTranslation } from 'react-i18next'
import type { Achievement } from '../../domain/achievements'
import { nextAchievement } from '../../domain/achievements'
import styles from './AchievementList.module.css'

interface Props {
  readonly achievements: readonly Achievement[]
  /** Cómo se llama el logro que pide esos días. */
  readonly name: (days: number) => string
  /** Cuántos días se llevan ahora hacia el siguiente. */
  readonly value: number
}

export function AchievementList({ achievements, name, value }: Props) {
  const { t } = useTranslation()
  const next = nextAchievement(achievements)

  return (
    <ul className={styles.list}>
      {achievements.map((achievement) => {
        const { days, reward, unlocked } = achievement
        const Icon = unlocked ? CheckCircleIcon : LockSimpleIcon
        return (
          <li key={days} className={styles.item} data-unlocked={unlocked}>
            <Icon
              className={styles.icon}
              weight={unlocked ? 'fill' : 'regular'}
              size={22}
              aria-hidden
            />
            <span className={styles.text}>
              <span className={styles.name}>{name(days)}</span>{' '}
              <span className={styles.status}>
                {unlocked
                  ? t('today.unlocked')
                  : achievement.days === next?.days
                    ? t('today.partial', { value, target: days })
                    : t('today.locked')}
              </span>
            </span>{' '}
            <span className={styles.reward}>{t('today.reward', { reward })}</span>
          </li>
        )
      })}
    </ul>
  )
}
