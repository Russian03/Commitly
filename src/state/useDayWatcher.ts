import { useEffect } from 'react'
import { onResume } from '../platform/lifecycle'

function millisToNextDay(now: Date): number {
  // Un segundo de margen sobre las 00:00 para que el reloj ya marque el día nuevo.
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
  return next.getTime() - now.getTime()
}

/** Avisa a medianoche y cada vez que se vuelve a la app. `refresh` debe ser estable. */
export function useDayWatcher(refresh: () => void): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(update, millisToNextDay(new Date()))
    }
    const update = () => {
      refresh()
      schedule()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') update()
    }

    schedule()
    document.addEventListener('visibilitychange', onVisibility)
    const stopResume = onResume(update)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      stopResume()
    }
  }, [refresh])
}
