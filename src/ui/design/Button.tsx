import type { ComponentPropsWithoutRef } from 'react'
import styles from './Button.module.css'

type Props = Omit<ComponentPropsWithoutRef<'button'>, 'className'> & {
  readonly variant?: 'primary' | 'soft' | 'quiet'
}

export function Button({ variant = 'primary', type = 'button', ...button }: Props) {
  return <button type={type} className={`${styles.button} ${styles[variant]}`} {...button} />
}
