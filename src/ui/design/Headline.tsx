import styles from './Text.module.css'

interface Props {
  /** Primera palabra, en cursiva. */
  readonly lead: string
  readonly first: string
  readonly second: string
}

export function Headline({ lead, first, second }: Props) {
  return (
    <h1 className={styles.headline}>
      <em>{lead}</em> {first}
      {/* Adorno: no se lee en voz alta. */}
      <sup className={styles.mark} aria-hidden="true">
        ®
      </sup>{' '}
      <br />
      {second}
    </h1>
  )
}
