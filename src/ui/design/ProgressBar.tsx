import styles from './ProgressBar.module.css'

interface Props {
  readonly value: number
  readonly max: number
  /** Con nombre se anuncia como barra de progreso; sin él es un adorno del texto que la acompaña. */
  readonly label?: string
}

export function ProgressBar({ value, max, label }: Props) {
  const semantics =
    label === undefined
      ? { 'aria-hidden': true }
      : {
          role: 'progressbar',
          'aria-label': label,
          'aria-valuemin': 0,
          'aria-valuemax': max,
          'aria-valuenow': value,
        }

  return (
    <span className={styles.bar} {...semantics}>
      <span className={styles.fill} style={{ width: `${Math.min(value / max, 1) * 100}%` }} />
    </span>
  )
}
