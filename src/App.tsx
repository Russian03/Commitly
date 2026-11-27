import { domMax, LazyMotion, MotionConfig } from 'motion/react'
import styles from './App.module.css'
import { Shell } from './app/Shell'
import { StatusScreen } from './app/StatusScreen'
import { useApp } from './state/context'
import { useDayWatcher } from './state/useDayWatcher'

export function App() {
  const ready = useApp((state) => state.status === 'ready')
  const refreshDay = useApp((state) => state.refreshDay)
  useDayWatcher(refreshDay)

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <div className={styles.app}>{ready ? <Shell /> : <StatusScreen />}</div>
      </MotionConfig>
    </LazyMotion>
  )
}
