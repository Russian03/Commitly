import * as m from 'motion/react-m'
import type { ReactNode } from 'react'
import styles from './CardGrid.module.css'

interface Props {
  readonly items: readonly { readonly key: string; readonly card: ReactNode }[]
}

/** Dos columnas; las tarjetas entran escalonadas y se recolocan con suavidad. */
export function CardGrid({ items }: Props) {
  return (
    <ul className={styles.grid}>
      {items.map(({ key, card }, index) => (
        <m.li
          key={key}
          layout="position"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.04 }}
        >
          {card}
        </m.li>
      ))}
    </ul>
  )
}
