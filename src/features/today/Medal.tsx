import * as m from 'motion/react-m'
import type { ColorLevel } from '../../domain/level'
import { prefersReducedMotion } from '../../ui/motion'
import styles from './Medal.module.css'
import { ringSeconds, STEP_SECONDS } from './ringTiming'

const CENTER = 110
const RING_RADIUS = 96
const RING_WIDTH = 10
/** Separación entre tramos: lo que sobresalen las puntas redondas y un hueco a la vista. */
const GAP = (RING_WIDTH + 6) / RING_RADIUS
/** El anillo arranca abajo, así que los primeros tramos son los de la izquierda. */
const START = Math.PI

/** El punto del anillo a `angle` radianes desde arriba, en el sentido del reloj. */
function point(angle: number): string {
  const x = CENTER + RING_RADIUS * Math.sin(angle)
  const y = CENTER - RING_RADIUS * Math.cos(angle)
  return `${x.toFixed(2)} ${y.toFixed(2)}`
}

const arc = (from: number, to: number) =>
  `A${RING_RADIUS} ${RING_RADIUS} 0 ${to - from > Math.PI ? 1 : 0} 1 ${point(to)}`

/** El tramo número `index` de un anillo partido en `total`. */
function segment(index: number, total: number): string {
  // Con un solo tramo no hay nada que separar: dos medias vueltas.
  if (total <= 1) {
    const half = START + Math.PI
    return `M${point(START)} ${arc(START, half)} ${arc(half, half + Math.PI)}`
  }
  const step = (Math.PI * 2) / total
  const from = START + index * step + GAP / 2
  const to = START + (index + 1) * step - GAP / 2
  return `M${point(from)} ${arc(from, to)}`
}

interface RingProps {
  readonly done: number
  readonly total: number
}

/**
 * Un tramo por meta del día. Se llenan siempre en el mismo orden, según cuántas van cumplidas y
 * no cuáles.
 */
function Ring({ done, total }: RingProps) {
  const animate = !prefersReducedMotion()

  return (
    <>
      {Array.from({ length: Math.max(total, 1) }, (_, index) => (
        <path key={index} className={styles.track} d={segment(index, total)} />
      ))}
      {Array.from({ length: done }, (_, index) => {
        const delay = ringSeconds(index)
        return (
          <m.path
            key={index}
            className={styles.fill}
            d={segment(index, total)}
            initial={animate ? { pathLength: 0, opacity: 0 } : false}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { delay, duration: STEP_SECONDS, ease: 'linear' },
              // Sin esto, la punta redonda asoma antes de que le toque.
              opacity: { delay, duration: 0.01 },
            }}
          />
        )
      })}
    </>
  )
}

interface Props extends RingProps {
  readonly level: ColorLevel
  readonly perfect: boolean
}

/** La medalla del día: se vuelve más verde cuanto más alto es el nivel. */
export function Medal({ level, perfect, done, total }: Props) {
  return (
    <div className={styles.medal}>
      {/* Adorno: el texto de la ficha ya dice cómo va el día. */}
      <svg viewBox="0 0 220 220" data-level={level} aria-hidden="true" focusable="false">
        <Ring done={done} total={total} />
        <m.g
          // Con el día completo, la medalla salta cuando el anillo se cierra.
          animate={perfect ? { scale: [1, 1.18, 1], rotate: [0, -10, 0] } : {}}
          transition={{ delay: ringSeconds(done), duration: 0.5 }}
        >
          <g className={styles.drawing}>
            <path className={styles.face} d="M76 44 H100 L124 94 L100 104 Z" />
            <path className={styles.face} d="M144 44 H120 L96 94 L120 104 Z" />
            <circle className={styles.face} cx="110" cy="125" r="44" />
            <circle className={styles.rim} cx="110" cy="125" r="34" />
          </g>
          {/* El símbolo del logo. */}
          <path
            className={styles.mark}
            transform="translate(91.7 106) scale(0.95)"
            d="M20 0 H30 A8.5 8.5 0 0 1 30 17 H22 A3 3 0 0 0 22 23 H30 A8.5 8.5 0 0 1 30 40 H20 A20 20 0 0 1 20 0 Z"
          />
        </m.g>
        {perfect ? (
          <g className={styles.sparkle}>
            <path d="M160 70 Q162.3 79.7 172 82 Q162.3 84.3 160 94 Q157.7 84.3 148 82 Q157.7 79.7 160 70 Z" />
            <path d="M56 142 Q57.5 148.5 64 150 Q57.5 151.5 56 158 Q54.5 151.5 48 150 Q54.5 148.5 56 142 Z" />
          </g>
        ) : null}
      </svg>
    </div>
  )
}
