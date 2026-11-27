import styles from './Text.module.css'

interface Props {
  readonly children: string
}

export function ScreenTitle({ children }: Props) {
  return <h1 className={styles.title}>{children}</h1>
}

export function SectionTitle({ children }: Props) {
  return <h2 className={`${styles.title} ${styles.section}`}>{children}</h2>
}
