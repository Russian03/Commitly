import { useTranslation } from 'react-i18next'
import { yearOf } from '../../domain/date'
import { useApp } from '../../state/context'
import { Panel } from '../../ui/design/Panel'
import { Screen } from '../../ui/design/Screen'
import { ScreenTitle } from '../../ui/design/Titles'

export function YearScreen() {
  const { t } = useTranslation()
  const year = useApp((state) => yearOf(state.today))

  return (
    <Screen>
      <ScreenTitle>{t('year.title', { year })}</ScreenTitle>
      <Panel>{t('common.comingSoon')}</Panel>
    </Screen>
  )
}
