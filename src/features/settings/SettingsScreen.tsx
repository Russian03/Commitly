import { useTranslation } from 'react-i18next'
import { Panel } from '../../ui/design/Panel'
import { Screen } from '../../ui/design/Screen'
import { ScreenTitle } from '../../ui/design/Titles'

export function SettingsScreen() {
  const { t } = useTranslation()

  return (
    <Screen>
      <ScreenTitle>{t('settings.title')}</ScreenTitle>
      <Panel>{t('settings.version', { version: __APP_VERSION__ })}</Panel>
    </Screen>
  )
}
