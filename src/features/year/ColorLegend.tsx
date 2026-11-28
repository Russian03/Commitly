import { useTranslation } from 'react-i18next'
import type { ColorLevel } from '../../domain/level'
import styles from './ColorLegend.module.css'

const LEVELS: readonly ColorLevel[] = [0, 1, 2, 3, 4]

interface Props {
  /** El verde más intenso al que se puede llegar hoy; su cuadro va señalado. */
  readonly ceiling: ColorLevel
  readonly caption: string | null
}

/** Los verdes de menor a mayor y hasta cuál se puede llegar hoy. */
export function ColorLegend({ ceiling, caption }: Props) {
  const { t } = useTranslation()

  return (
    <div className={styles.legend}>
      {/* Adorno: cada día de la cuadrícula ya dice su verde. */}
      <div className={styles.scale} aria-hidden="true">
        <span>{t('year.less')}</span>
        {LEVELS.map((level) => (
          <span
            key={level}
            className={styles.swatch}
            data-level={level}
            data-ceiling={level > 0 && level === ceiling}
          />
        ))}
        <span>{t('year.more')}</span>
      </div>
      {caption ? <p className={styles.caption}>{caption}</p> : null}
    </div>
  )
}
