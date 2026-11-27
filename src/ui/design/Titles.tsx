import type { ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'
import styles from './Text.module.css'

interface TitleProps {
  readonly children: string
  /** En las páginas que se abren encima, para que el lector de pantalla las anuncie. */
  readonly focusOnMount?: boolean
}

export function ScreenTitle({ children, focusOnMount = false }: TitleProps) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (focusOnMount) ref.current?.focus()
  }, [focusOnMount])

  return (
    <h1 ref={ref} className={styles.title} tabIndex={focusOnMount ? -1 : undefined}>
      {children}
    </h1>
  )
}

interface SectionProps {
  readonly title: string
  readonly children: ReactNode
}

export function Section({ title, children }: SectionProps) {
  const id = useId()

  return (
    <section className={styles.block} aria-labelledby={id}>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {children}
    </section>
  )
}
