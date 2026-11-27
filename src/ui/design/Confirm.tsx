import { Button } from './Button'
import styles from './Confirm.module.css'

interface Props {
  readonly question: string
  readonly confirmLabel: string
  readonly cancelLabel: string
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

/** Segundo paso antes de una acción que no se puede deshacer. */
export function Confirm({ question, confirmLabel, cancelLabel, onConfirm, onCancel }: Props) {
  return (
    <div className={styles.confirm}>
      <p>{question}</p>
      <div className={styles.actions}>
        <Button variant="soft" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  )
}
