import { useEffect } from 'react'
import { POINTS_HOUR } from '../domain/points'
import { onResume } from '../platform/lifecycle'

/** Hasta la próxima medianoche o la hora a la que se suman los puntos, lo que llegue antes. */
function millisToNextChange(now: Date): number {
  // Un segundo de margen para que el reloj ya marque el día o la hora nuevos.
  const at = (days: number, hour: number) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, hour, 0, 1).getTime()
  const upcoming = [at(0, POINTS_HOUR), at(1, 0)].filter((time) => time > now.getTime())
  return Math.min(...upcoming) - now.getTime()
}

/**
 * Avisa a medianoche, a la hora de los puntos y cada vez que se vuelve a la app. `refresh` debe
 * ser estable.
 */
export function useDayWatcher(refresh: () => void): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(update, millisToNextChange(new Date()))
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
