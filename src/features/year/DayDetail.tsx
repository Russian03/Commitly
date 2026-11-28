import { useTranslation } from 'react-i18next'
import type { YearCell } from '../../domain/year'
import { Strip } from '../../ui/design/Strip'
import styles from './DayDetail.module.css'
import type { DayText } from './yearText'

/** El día elegido, con su color en grande. */
export function DayDetail({ cell, text }: { readonly cell: YearCell; readonly text: DayText }) {
  return (
    <Strip
      heading="h2"
      lead={
        <span
          className={styles.swatch}
          data-level={cell.summary?.level ?? 0}
          data-timing={cell.timing}
          aria-hidden="true"
        />
      }
      title={text.title}
      details={text.details}
    />
  )
}

/** Sin día elegido: la misma tira, para que la cuadrícula no cambie de tamaño al elegir. */
export function NoDayDetail() {
  const { t } = useTranslation()

  return (
    <Strip
      heading="h2"
      // El contorno de un día sin pintar.
      lead={<span className={styles.swatch} data-timing="future" aria-hidden="true" />}
      title={t('year.pick.title')}
      details={[t('year.pick.open'), t('year.pick.close')]}
    />
  )
}
