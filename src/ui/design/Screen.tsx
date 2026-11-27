import type { ReactNode } from 'react'
import { Logo } from './Logo'
import styles from './Screen.module.css'

interface Props {
  /** Botón de la esquina superior derecha. */
  readonly action?: ReactNode
  readonly children: ReactNode
}

export function Screen({ action, children }: Props) {
  return (
    <>
      <header className={styles.header}>
        <Logo />
        {action ? <div className={styles.action}>{action}</div> : null}
      </header>
      {children}
    </>
  )
}
