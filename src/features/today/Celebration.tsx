import * as m from 'motion/react-m'
import { useState } from 'react'
import { prefersReducedMotion } from '../../ui/motion'
import styles from './Celebration.module.css'

const COUNT = 18
const DURATION = 1.1

/** Cuadraditos verdes, como los del año, repartidos en dos radios alrededor de la medalla. */
const PIECES = Array.from({ length: COUNT }, (_, index) => {
  const angle = (index / COUNT) * Math.PI * 2
  const distance = index % 2 === 0 ? 165 : 115
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    turn: index % 3 === 0 ? -160 : 130,
    shade: (index % 4) + 1,
  }
})

/** Estalla una vez al enseñar un día perfecto, pasados `delay` segundos, y desaparece. */
export function Celebration({ delay }: { readonly delay: number }) {
  const [finished, setFinished] = useState(false)
  if (finished || prefersReducedMotion()) return null

  return (
    <div className={styles.celebration} aria-hidden="true" data-testid="celebration">
      {PIECES.map((piece, index) => (
        <m.span
          key={index}
          className={styles.piece}
          data-shade={piece.shade}
          // Invisibles hasta que salen, y se apagan en la segunda mitad del recorrido.
          initial={{ x: 0, y: 0, rotate: 0, scale: 0.4, opacity: 0 }}
          animate={{ x: piece.x, y: piece.y, rotate: piece.turn, scale: 1, opacity: [1, 1, 0] }}
          transition={{ duration: DURATION, delay, ease: [0.2, 0.7, 0.4, 1] }}
          // Todos duran lo mismo: cuando acaba uno, han acabado todos.
          onAnimationComplete={() => {
            setFinished(true)
          }}
        />
      ))}
    </div>
  )
}
