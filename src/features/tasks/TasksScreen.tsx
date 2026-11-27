import { PlusIcon } from '@phosphor-icons/react/Plus'
import { useTranslation } from 'react-i18next'
import { Headline } from '../../ui/design/Headline'
import { IconButton } from '../../ui/design/IconButton'
import { Panel } from '../../ui/design/Panel'
import { Screen } from '../../ui/design/Screen'
import { SectionTitle } from '../../ui/design/Titles'

export function TasksScreen() {
  const { t } = useTranslation()

  return (
    // El catálogo de metas llega en el siguiente bloque.
    <Screen action={<IconButton label={t('tasks.add')} icon={PlusIcon} disabled />}>
      <Headline
        lead={t('tasks.headline.lead')}
        first={t('tasks.headline.first')}
        second={t('tasks.headline.second')}
      />
      <SectionTitle>{t('tasks.todayTitle')}</SectionTitle>
      <Panel>{t('tasks.empty')}</Panel>
    </Screen>
  )
}
