import styles from './Panel.module.css'

/** Superficie menta para los estados vacíos. */
export function Panel({ children }: { readonly children: string }) {
  return <p className={styles.panel}>{children}</p>
}
