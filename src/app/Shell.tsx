import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TaskPage } from '../features/tasks/TaskPage'
import { BottomNav } from '../ui/design/BottomNav'
import type { Navigation, SectionId } from './navigation'
import { closePages, goBack, goTo, openPage, START } from './navigation'
import type { Navigator } from './navigator'
import { NavigatorContext } from './navigator'
import { SaveBanner } from './SaveBanner'
import { SECTIONS } from './sections'
import styles from './Shell.module.css'
import { useBackNavigation } from './useBackNavigation'

/** La app ya cargada: la sección o la página abierta y la barra inferior. */
export function Shell() {
  const { t } = useTranslation()
  const [{ navigation, intro }, setState] = useState({ navigation: START, intro: true })

  const move = useCallback((next: (current: Navigation) => Navigation) => {
    setState((state) => ({ navigation: next(state.navigation), intro: false }))
  }, [])
  const navigate = useCallback(
    (next: Navigation) => {
      move(() => next)
    },
    [move],
  )
  useBackNavigation(navigation, navigate)

  const navigator = useMemo<Navigator>(
    () => ({
      intro,
      open: (page) => {
        move((current) => openPage(current, page))
      },
      back: () => {
        move((current) => goBack(current) ?? current)
      },
      close: () => {
        move(closePages)
      },
    }),
    [intro, move],
  )

  const page = navigation.pages[navigation.pages.length - 1]
  const items = SECTIONS.map(({ id, icon }) => ({ id, icon, label: t(`nav.${id}`) }))
  const select = (id: SectionId) => {
    navigate(goTo(id))
  }

  return (
    <NavigatorContext value={navigator}>
      {page ? (
        // La clave hace que cada página empiece arriba del todo y sin datos de la anterior.
        <main key={JSON.stringify(page)} className={styles.page}>
          <TaskPage page={page} />
        </main>
      ) : (
        SECTIONS.filter(({ id }) => id === navigation.section).map(({ id, Screen }) => (
          // Enfocable para desplazarla con teclado aunque no tenga botones.
          <main key={id} className={styles.main} tabIndex={0}>
            <Screen />
          </main>
        ))
      )}
      <SaveBanner />
      {page ? null : (
        <BottomNav
          label={t('nav.label')}
          items={items}
          active={navigation.section}
          onSelect={select}
        />
      )}
    </NavigatorContext>
  )
}
