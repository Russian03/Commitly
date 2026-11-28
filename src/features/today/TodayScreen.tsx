import { StarIcon } from '@phosphor-icons/react/Star'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import type { Award } from '../../domain/award'
import { todayAward } from '../../domain/award'
import { useApp } from '../../state/context'
import { Screen } from '../../ui/design/Screen'
import { Strip } from '../../ui/design/Strip'
import { Tile } from '../../ui/design/Tile'
import { ScreenTitle, Section } from '../../ui/design/Titles'
import { Celebration } from './Celebration'
import { GoalStrip } from './GoalStrip'
import { Medal } from './Medal'
import { Milestones, PerfectStreak } from './PerfectDays'
import { ringSeconds } from './ringTiming'
import styles from './TodayScreen.module.css'

/** El dato pequeño bajo la medalla. */
function dayDetail({ state, day, earned }: Award, t: TFunction): string {
  if (state === 'no-goals') return t('today.emptyHint')
  if (state === 'rest') return t('tasks.restDay')
  const progress = t('today.progress', { done: day.done, count: day.total })
  // Antes de marcar nada no hace falta recordar que van cero puntos.
  return earned > 0 ? `${progress} · ${t('today.dayPoints', { count: earned })}` : progress
}

/** Los galardones: la medalla de hoy, los días perfectos, el nivel y cada meta. */
export function TodayScreen() {
  const { t } = useTranslation()
  const data = useApp((state) => state.data)
  const today = useApp((state) => state.today)
  const credited = useApp((state) => state.creditedThrough)

  const award = todayAward(data, today, credited)
  const { state, day, points, pending, progress, perfect, milestones, goals } = award
  const next = progress.level + 1
  const total = t('today.totalPoints', { count: points })

  return (
    <Screen>
      <ScreenTitle>{t('today.title')}</ScreenTitle>
      <div className={styles.content}>
        <Tile title={t(`today.state.${state}`)} meta={dayDetail(award, t)}>
          <Medal level={day.level} perfect={day.perfect} done={day.done} total={day.total} />
          {/* La fiesta empieza cuando el anillo termina de llenarse. */}
          {day.perfect ? <Celebration delay={ringSeconds(day.done)} /> : null}
        </Tile>

        <div className={styles.strips}>
          <PerfectStreak run={perfect} />
          <Strip
            heading="h2"
            lead={<StarIcon weight="fill" size={32} aria-hidden />}
            title={t('today.level', { level: progress.level })}
            progress={{
              value: progress.current,
              max: progress.required,
              label: t('today.progressLabel', { next }),
            }}
            details={[
              pending > 0 ? `${total} · ${t('today.pendingPoints', { count: pending })}` : total,
              t('today.toNext', { count: progress.required - progress.current, next }),
            ]}
          />
          <Milestones milestones={milestones} total={perfect.total} />
        </div>
      </div>

      {goals.length > 0 ? (
        <Section title={t('today.streaks')}>
          <ul className={styles.strips}>
            {goals.map((item) => (
              <li key={item.goal.id}>
                <GoalStrip goal={item.goal} run={item.run} achievements={item.achievements} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </Screen>
  )
}
