import { PlusIcon } from '@phosphor-icons/react/Plus'
import styles from './Card.module.css'

interface Props {
  readonly title: string
  readonly onClick: () => void
}

/** Una ficha más, para añadir otra. */
export function AddCard({ title, onClick }: Props) {
  return (
    <button type="button" className={styles.main} onClick={onClick}>
      <span className={styles.art}>
        <PlusIcon weight="light" size={44} aria-hidden />
      </span>
      <span className={styles.addTitle} data-title>
        {title}
      </span>
    </button>
  )
}
