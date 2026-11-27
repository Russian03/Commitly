import { useTranslation } from 'react-i18next'
import { activeGoals } from '../../domain/history'
import { useApp } from '../../state/context'
import { Panel } from '../../ui/design/Panel'
import { Screen } from '../../ui/design/Screen'
import { ScreenTitle } from '../../ui/design/Titles'
import styles from './EditScreen.module.css'
import { GoalRow } from './GoalRow'

export function EditScreen() {
  const { t } = useTranslation()
  const data = useApp((state) => state.data)
  const goals = activeGoals(data)

  return (
    <Screen>
      <ScreenTitle>{t('edit.title')}</ScreenTitle>
      {goals.length > 0 ? (
        <ul className={styles.list}>
          {goals.map((goal) => (
            <li key={goal.id}>
              <GoalRow goal={goal} />
            </li>
          ))}
        </ul>
      ) : (
        <Panel>{t('edit.empty')}</Panel>
      )}
    </Screen>
  )
}
