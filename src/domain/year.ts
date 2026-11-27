import type { AppData } from './appData'
import { recordedDays } from './appData'
import type { DayKey } from './date'
import { daysOfYear, yearOf } from './date'
import type { DaySummary } from './summary'
import { summarizeDay } from './summary'

export type DayTiming = 'past' | 'today' | 'future'

export interface YearCell {
  readonly day: DayKey
  readonly timing: DayTiming
  /** `null` en los días futuros y en los que no hay registro. */
  readonly summary: DaySummary | null
}

function timingOf(day: DayKey, today: DayKey): DayTiming {
  if (day === today) return 'today'
  return day < today ? 'past' : 'future'
}

export function yearCells(data: AppData, year: number, today: DayKey): YearCell[] {
  return daysOfYear(year).map((day) => {
    const timing = timingOf(day, today)
    const record = timing === 'future' ? undefined : data.days[day]
    return { day, timing, summary: record ? summarizeDay(record) : null }
  })
}

/** Los años que se pueden consultar, del más antiguo al actual. */
export function recordedYears(data: AppData, today: DayKey): number[] {
  const past = recordedDays(data).filter((day) => day <= today)
  return [...new Set([...past, today].map(yearOf))].sort((a, b) => a - b)
}

export interface GridFit {
  readonly columns: number
  readonly rows: number
  /** Lado de cada casilla, en las mismas unidades que el hueco. */
  readonly cellSize: number
}

/** Reparte `count` casillas cuadradas en un hueco, con el mayor tamaño posible y sin scroll. */
export function fitGrid(count: number, width: number, height: number, gap: number): GridFit | null {
  let best: GridFit | null = null
  for (let columns = 1; columns <= count; columns += 1) {
    const rows = Math.ceil(count / columns)
    const cellSize = Math.min(
      (width - gap * (columns - 1)) / columns,
      (height - gap * (rows - 1)) / rows,
    )
    if (cellSize > 0 && cellSize > (best?.cellSize ?? 0)) best = { columns, rows, cellSize }
  }
  return best
}
