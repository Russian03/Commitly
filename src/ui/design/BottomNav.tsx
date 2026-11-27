import type { Icon } from '@phosphor-icons/react'
import * as m from 'motion/react-m'
import styles from './BottomNav.module.css'
import { IconButton } from './IconButton'

export interface NavItem<Id extends string> {
  readonly id: Id
  readonly label: string
  readonly icon: Icon
}

interface Props<Id extends string> {
  readonly label: string
  readonly items: readonly NavItem<Id>[]
  readonly active: Id
  readonly onSelect: (id: Id) => void
}

export function BottomNav<Id extends string>({ label, items, active, onSelect }: Props<Id>) {
  return (
    <nav className={styles.nav} aria-label={label}>
      <ul className={styles.list}>
        {items.map((item) => (
          <m.li
            key={item.id}
            layout="position"
            transition={{ type: 'spring', stiffness: 520, damping: 42 }}
            className={item.id === active ? styles.active : undefined}
          >
            <IconButton
              label={item.label}
              icon={item.icon}
              aria-current={item.id === active ? 'page' : undefined}
              onClick={() => {
                onSelect(item.id)
              }}
            />
          </m.li>
        ))}
      </ul>
    </nav>
  )
}
