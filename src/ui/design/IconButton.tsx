import type { Icon } from '@phosphor-icons/react'
import type { ComponentPropsWithoutRef } from 'react'
import styles from './IconButton.module.css'

type Props = Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'className' | 'type'> & {
  readonly label: string
  readonly icon: Icon
}

export function IconButton({ label, icon: Glyph, ...button }: Props) {
  return (
    <button type="button" className={styles.button} aria-label={label} {...button}>
      <Glyph weight="light" size={22} aria-hidden />
    </button>
  )
}
