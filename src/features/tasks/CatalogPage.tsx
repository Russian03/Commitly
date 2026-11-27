import { XIcon } from '@phosphor-icons/react/X'
import { useTranslation } from 'react-i18next'
import { useNavigator } from '../../app/navigator'
import { PRESET_IDS } from '../../domain/goal'
import { activeGoals } from '../../domain/history'
import { useApp } from '../../state/context'
import { Card } from '../../ui/design/Card'
import { CardGrid } from '../../ui/design/CardGrid'
import { IconButton } from '../../ui/design/IconButton'
import { Screen } from '../../ui/design/Screen'
import { ScreenTitle } from '../../ui/design/Titles'
import { CUSTOM_ILLUSTRATION, illustrationFor } from './illustrations'

export function CatalogPage() {
  const { t } = useTranslation()
  const navigator = useNavigator()
  const data = useApp((state) => state.data)
  const added = new Set(
    activeGoals(data).map(({ content }) => (content.kind === 'preset' ? content.preset : null)),
  )

  const presets = PRESET_IDS.map((preset) => ({
    key: preset,
    card: (
      <Card
        image={illustrationFor({ kind: 'preset', preset })}
        meta={added.has(preset) ? t('catalog.added') : t(`goals.categories.${preset}`)}
        title={t(`goals.presets.${preset}`)}
        disabled={added.has(preset)}
        onClick={() => {
          navigator.open({ kind: 'create', preset })
        }}
      />
    ),
  }))
  const own = {
    key: 'custom',
    card: (
      <Card
        image={CUSTOM_ILLUSTRATION}
        meta={t('goals.categories.custom')}
        title={t('goals.custom')}
        onClick={() => {
          navigator.open({ kind: 'create', preset: null })
        }}
      />
    ),
  }

  return (
    <Screen
      action={<IconButton label={t('catalog.close')} icon={XIcon} onClick={navigator.back} />}
    >
      <ScreenTitle focusOnMount>{t('catalog.title')}</ScreenTitle>
      <CardGrid items={[...presets, own]} />
    </Screen>
  )
}
