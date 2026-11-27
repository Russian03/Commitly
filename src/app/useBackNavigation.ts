import { useEffect, useRef } from 'react'
import { minimizeApp, onBackButton } from '../platform/lifecycle'
import type { Navigation } from './navigation'
import { goBack } from './navigation'

/** «Atrás» de Android y la tecla Escape. En el inicio, Android manda la app a segundo plano. */
export function useBackNavigation(
  navigation: Navigation,
  navigate: (navigation: Navigation) => void,
): void {
  const latest = useRef(navigation)

  useEffect(() => {
    latest.current = navigation
  }, [navigation])

  useEffect(() => {
    const back = (atStart: () => void) => {
      const previous = goBack(latest.current)
      if (previous) navigate(previous)
      else atStart()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') back(() => undefined)
    }

    window.addEventListener('keydown', onKey)
    const stop = onBackButton(() => {
      back(minimizeApp)
    })
    return () => {
      window.removeEventListener('keydown', onKey)
      stop()
    }
  }, [navigate])
}
