import { useTranslation } from 'react-i18next'
import { useNavigator } from '../../app/navigator'
import { goalsForDay } from '../../domain/selectors'
import { activeGoals } from '../../domain/history'
import { useApp } from '../../state/context'
import { AddCard } from '../../ui/design/AddCard'
import { Card } from '../../ui/design/Card'
import { CardGrid } from '../../ui/design/CardGrid'
import { Headline } from '../../ui/design/Headline'
import { Panel } from '../../ui/design/Panel'
import { Screen } from '../../ui/design/Screen'
import { Section } from '../../ui/design/Titles'
import { goalName, scheduleSummary } from './goalText'
import { illustrationFor } from './illustrations'
import styles from './TasksScreen.module.css'

export function TasksScreen() {
  const { t, i18n } = useTranslation()
  const navigator = useNavigator()
  const data = useApp((state) => state.data)
  const today = useApp((state) => state.today)
  const toggle = useApp((state) => state.toggle)

  const todays = goalsForDay(data, today)
  // Hay metas, pero ninguna para hoy: sin explicarlo parecería que se han perdido.
  const restDay = todays.length === 0 && activeGoals(data).length > 0

  const cards = todays.map(({ goal, done }) => ({
    key: goal.id,
    card: (
      <Card
        image={illustrationFor(goal.content)}
        meta={done ? t('tasks.done') : scheduleSummary(goal.weekdays, t, i18n.language)}
        title={goalName(goal.content, t)}
        checked={done}
        onClick={() => {
          toggle(goal.id)
        }}
      />
    ),
  }))
  const add = {
    key: 'add',
    card: (
      <AddCard
        title={t('tasks.add')}
        onClick={() => {
          navigator.open({ kind: 'catalog' })
        }}
      />
    ),
  }

  return (
    <Screen>
      <Headline
        play={navigator.intro}
        lead={t('tasks.headline.lead')}
        first={t('tasks.headline.first')}
        second={t('tasks.headline.second')}
      />
      <Section title={t('tasks.todayTitle')}>
        <div className={styles.today}>
          {restDay ? <Panel>{t('tasks.restDay')}</Panel> : null}
          <CardGrid items={[...cards, add]} />
        </div>
      </Section>
    </Screen>
  )
}
