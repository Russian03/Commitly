import { CheckIcon } from '@phosphor-icons/react/Check'
import { ClickSpark } from '../reactbits/ClickSpark'
import styles from './Card.module.css'

interface Props {
  readonly image: string
  readonly meta: string
  readonly title: string
  /** Presente solo en las tarjetas que se marcan. */
  readonly checked?: boolean
  readonly disabled?: boolean
  readonly onClick: () => void
}

/** Ilustración sobre menta, dato pequeño y título, como una ficha. */
export function Card({ image, meta, title, checked, disabled, onClick }: Props) {
  return (
    <div>
      <ClickSpark active={checked === false}>
        <button
          type="button"
          className={styles.main}
          onClick={onClick}
          disabled={disabled}
          aria-pressed={checked}
        >
          <span className={styles.art}>
            <img src={image} alt="" draggable={false} />
            {checked ? (
              <span className={styles.check}>
                <CheckIcon weight="bold" size={18} aria-hidden />
              </span>
            ) : null}
          </span>
          {/* El título va primero al leer; el CSS pone el dato encima, como en una ficha. */}
          <span className={styles.title} data-title>
            {title}
          </span>{' '}
          <span className={styles.meta}>{meta}</span>
        </button>
      </ClickSpark>
    </div>
  )
}
