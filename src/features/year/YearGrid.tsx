import type { KeyboardEvent } from 'react'
import { memo } from 'react'
import type { DayKey } from '../../domain/date'
import type { YearCell } from '../../domain/year'
import { fitGrid } from '../../domain/year'
import { useElementSize } from '../../ui/useElementSize'
import styles from './YearGrid.module.css'

const GAP = 3

/** La casilla a la que lleva cada tecla, partiendo de `from`. */
function target(key: string, from: number, columns: number, count: number): number | null {
  const moves: Partial<Record<string, number>> = {
    ArrowLeft: from - 1,
    ArrowRight: from + 1,
    ArrowUp: from - columns,
    ArrowDown: from + columns,
    Home: 0,
    End: count - 1,
  }
  return moves[key] ?? null
}

interface DayButtonProps {
  readonly cell: YearCell
  readonly name: string
  readonly selected: boolean
  readonly tabStop: boolean
  readonly onSelect: (day: DayKey) => void
}

// Memorizado: al elegir un día solo cambian él y el anterior, no los 365.
const DayButton = memo(function DayButton({
  cell,
  name,
  selected,
  tabStop,
  onSelect,
}: DayButtonProps) {
  return (
    <button
      type="button"
      className={styles.cell}
      data-level={cell.summary?.level ?? 0}
      data-timing={cell.timing}
      aria-label={name}
      aria-current={cell.timing === 'today' ? 'date' : undefined}
      aria-pressed={selected}
      tabIndex={tabStop ? 0 : -1}
      onClick={() => {
        onSelect(cell.day)
      }}
    />
  )
})

interface Props {
  readonly label: string
  readonly cells: readonly YearCell[]
  readonly selected: DayKey | null
  /** La única casilla a la que se llega con el tabulador. */
  readonly tabStop: DayKey
  /** Cómo se anuncia cada casilla, en el mismo orden. */
  readonly names: readonly string[]
  readonly onSelect: (day: DayKey) => void
}

/** Un cuadro por día, tan grandes como permita el hueco para que quepan todos sin desplazar. */
export function YearGrid({ label, cells, selected, tabStop, names, onSelect }: Props) {
  const [ref, size] = useElementSize()
  const fit = size ? fitGrid(cells.length, size.width, size.height, GAP) : null
  const side = fit ? Math.floor(fit.cellSize) : 0

  // Con el teclado hay una sola parada en la cuadrícula; dentro se mueve con las flechas.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!fit) return
    const buttons = [...event.currentTarget.querySelectorAll('button')]
    const from = buttons.findIndex((button) => button === event.target)
    const to = target(event.key, from, fit.columns, buttons.length)
    if (from < 0 || to === null) return
    event.preventDefault()
    buttons[to]?.focus()
  }

  return (
    <div ref={ref} className={styles.area}>
      {fit ? (
        <div
          role="group"
          aria-label={label}
          className={styles.grid}
          style={{
            gap: GAP,
            gridTemplateColumns: `repeat(${fit.columns}, ${side}px)`,
            gridAutoRows: `${side}px`,
          }}
          onKeyDown={onKeyDown}
        >
          {cells.map((cell, index) => (
            <DayButton
              key={cell.day}
              cell={cell}
              name={names[index] ?? ''}
              selected={cell.day === selected}
              tabStop={cell.day === tabStop}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
