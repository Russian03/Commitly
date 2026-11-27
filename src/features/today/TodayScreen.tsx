import { useTranslation } from 'react-i18next'
import { Panel } from '../../ui/design/Panel'
import { Screen } from '../../ui/design/Screen'
import { ScreenTitle } from '../../ui/design/Titles'

export function TodayScreen() {
  const { t } = useTranslation()

  return (
    <Screen>
      <ScreenTitle>{t('today.title')}</ScreenTitle>
      <Panel>{t('common.comingSoon')}</Panel>
    </Screen>
  )
}
