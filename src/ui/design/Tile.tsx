import type { ReactNode } from 'react'
import styles from './Tile.module.css'

interface Props {
  readonly title: string
  readonly meta: string
  /** Lo que va sobre la superficie menta. */
  readonly children: ReactNode
}

/** La misma composición que una tarjeta, en grande, para enseñar un resultado. */
export function Tile({ title, meta, children }: Props) {
  return (
    <div className={styles.tile}>
      {/* El título va primero al leer; el CSS lo deja al final, como en una ficha. */}
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.art}>{children}</div>
      <p className={styles.meta}>{meta}</p>
    </div>
  )
}
