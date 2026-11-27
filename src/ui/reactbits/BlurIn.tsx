/*
 * Inspirado en BlurText, de React Bits (https://github.com/DavidHDev/react-bits, commit a30a9da).
 * © 2026 David Haz. MIT + Commons Clause: ver docs/licencias/ReactBits-LICENSE.md.
 * Cambios: anima un fragmento ya formateado en lugar de trocear un texto.
 */
import * as m from 'motion/react-m'
import type { ReactNode } from 'react'
import { prefersReducedMotion } from '../motion'
import styles from './BlurIn.module.css'

interface Props {
  readonly play: boolean
  /** Posición en la secuencia: cada fragmento entra un poco después que el anterior. */
  readonly order: number
  readonly children: ReactNode
}

export function BlurIn({ play, order, children }: Props) {
  const animate = play && !prefersReducedMotion()

  return (
    <m.span
      className={styles.piece}
      initial={animate ? { opacity: 0, filter: 'blur(10px)', y: -18 } : false}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration: 0.5, delay: order * 0.12, ease: [0.33, 1, 0.68, 1] }}
    >
      {children}
    </m.span>
  )
}
