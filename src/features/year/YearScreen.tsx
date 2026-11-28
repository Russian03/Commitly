import { CaretLeftIcon } from '@phosphor-icons/react/CaretLeft'
import { CaretRightIcon } from '@phosphor-icons/react/CaretRight'
import type { TFunction } from 'i18next'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DayKey } from '../../domain/date'
import { yearOf } from '../../domain/date'
import { colorCeiling } from '../../domain/level'
import type { DaySummary } from '../../domain/summary'
import { summarizeDay } from '../../domain/summary'
import { defaultDay, recordedYears, yearCells } from '../../domain/year'
import { useApp } from '../../state/context'
import { IconButton } from '../../ui/design/IconButton'
import { Screen } from '../../ui/design/Screen'
import { ScreenTitle } from '../../ui/design/Titles'
import { ColorLegend } from './ColorLegend'
import { DayDetail, NoDayDetail } from './DayDetail'
import { YearGrid } from './YearGrid'
import styles from './YearScreen.module.css'
import { dayDescriber } from './yearText'

/** Hasta qué verde se puede llegar hoy, o nada si hoy no toca ninguna meta. */
function scaleCaption(today: DaySummary | null, t: TFunction): string | null {
  if (!today || today.rest) return null
  const ceiling = colorCeiling(today.total)
  if (today.level === 4) return t('year.scale.reached')
  if (ceiling === 4) return t('year.scale.reachable')
  return t('year.scale.limited', { count: today.total, ceiling })
}

/** El año entero de un vistazo: un cuadro por día, más verde cuanto mejor fue. */
export function YearScreen() {
  const { t, i18n } = useTranslation()
  const data = useApp((state) => state.data)
  const today = useApp((state) => state.today)
  // `null` sigue al presente: al cambiar de año, la pantalla avanza sola.
  const [chosenYear, setChosenYear] = useState<number | null>(null)
  // La última casilla tocada y si sigue elegida. Al entrar no hay ninguna.
  const [touched, setTouched] = useState<{ day: DayKey; open: boolean } | null>(null)

  const current = yearOf(today)
  const years = recordedYears(data, today)
  const year = chosenYear !== null && years.includes(chosenYear) ? chosenYear : current
  const last = touched && yearOf(touched.day) === year ? touched : null
  const selected = last?.open ? last.day : null
  // Por dónde entra el teclado: la última casilla tocada, aunque ya se haya soltado.
  const tabStop = last?.day ?? defaultDay(data, year, today)
  // Estable, para que las casillas memorizadas no se rehagan.
  const toggle = useCallback((day: DayKey) => {
    setTouched((previous) => ({ day, open: !(previous?.open && previous.day === day) }))
  }, [])

  const describe = useMemo(() => dayDescriber(t, i18n.language), [t, i18n.language])
  // Solo cambian con los datos, el año o el día: elegir una casilla no los rehace.
  const cells = useMemo(() => yearCells(data, year, today), [data, year, today])
  const names = useMemo(
    () =>
      cells.map((cell) => {
        const { title, details } = describe(cell)
        return `${title}: ${details.join(', ')}`
      }),
    [cells, describe],
  )
  const selectedCell = cells.find((cell) => cell.day === selected)
  const record = data.days[today]
  const todaySummary = record ? summarizeDay(record) : null

  const position = years.indexOf(year)
  const show = (next: number | undefined) => {
    if (next === undefined) return
    setChosenYear(next === current ? null : next)
    setTouched(null)
  }

  return (
    <div className={styles.screen}>
      <Screen>
        <div className={styles.heading}>
          <ScreenTitle>{t('year.title', { year })}</ScreenTitle>
          {years.length > 1 ? (
            <div className={styles.years}>
              <IconButton
                label={t('year.previous')}
                icon={CaretLeftIcon}
                disabled={position === 0}
                onClick={() => {
                  show(years[position - 1])
                }}
              />
              <IconButton
                label={t('year.next')}
                icon={CaretRightIcon}
                disabled={position === years.length - 1}
                onClick={() => {
                  show(years[position + 1])
                }}
              />
            </div>
          ) : null}
        </div>
        <YearGrid
          label={t('year.days', { year })}
          cells={cells}
          selected={selected}
          tabStop={tabStop}
          names={names}
          onSelect={toggle}
        />
        <div className={styles.below}>
          <ColorLegend
            ceiling={colorCeiling(todaySummary?.total ?? 0)}
            caption={scaleCaption(todaySummary, t)}
          />
          {selectedCell ? (
            <DayDetail cell={selectedCell} text={describe(selectedCell)} />
          ) : (
            <NoDayDetail />
          )}
        </div>
      </Screen>
    </div>
  )
}
