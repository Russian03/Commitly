import { domMax, LazyMotion, MotionConfig } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './App.module.css'
import type { SectionId } from './app/sections'
import { SECTIONS } from './app/sections'
import { BottomNav } from './ui/design/BottomNav'

export function App() {
  const { t } = useTranslation()
  const [active, setActive] = useState<SectionId>('tasks')

  const items = SECTIONS.map(({ id, icon }) => ({ id, icon, label: t(`nav.${id}`) }))

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <div className={styles.app}>
          {SECTIONS.filter(({ id }) => id === active).map(({ id, Screen }) => (
            // La clave por sección hace que cada una empiece arriba del todo.
            <main key={id} className={styles.main}>
              <Screen />
            </main>
          ))}
          <BottomNav label={t('nav.label')} items={items} active={active} onSelect={setActive} />
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
