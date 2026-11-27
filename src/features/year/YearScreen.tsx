import { useTranslation } from 'react-i18next'
import { toDayKey, yearOf } from '../../domain/date'
import { Panel } from '../../ui/design/Panel'
import { Screen } from '../../ui/design/Screen'
import { ScreenTitle } from '../../ui/design/Titles'

export function YearScreen() {
  const { t } = useTranslation()
  const year = yearOf(toDayKey(new Date()))

  return (
    <Screen>
      <ScreenTitle>{t('year.title', { year })}</ScreenTitle>
      <Panel>{t('common.comingSoon')}</Panel>
    </Screen>
  )
}
