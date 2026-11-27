import { describe, expect, it } from 'vitest'
import { dataWith, record } from './testing'
import { fitGrid, recordedYears, yearCells } from './year'

const data = dataWith({
  days: {
    '2025-12-31': record(['g1'], ['g1']),
    '2026-11-26': record(['g1', 'g2'], ['g1']),
    '2026-11-27': record(['g1']),
    '2026-11-28': record(['g1'], ['g1']),
  },
})

describe('yearCells', () => {
  const cells = yearCells(data, 2026, '2026-11-27')
  const cell = (day: string) => cells.find((item) => item.day === day)

  it('tiene una casilla por cada día del año', () => {
    expect(cells).toHaveLength(365)
    expect(yearCells(data, 2028, '2026-11-27')).toHaveLength(366)
  })

  it('distingue pasado, hoy y futuro', () => {
    expect(cell('2026-11-26')?.timing).toBe('past')
    expect(cell('2026-11-27')?.timing).toBe('today')
    expect(cell('2026-11-28')?.timing).toBe('future')
  })

  it('resume los días registrados', () => {
    expect(cell('2026-11-26')?.summary).toMatchObject({ done: 1, total: 2, level: 1 })
  })

  it('deja sin resumen los días sin registro', () => {
    expect(cell('2026-01-01')?.summary).toBeNull()
  })

  it('no pinta el futuro aunque haya datos (reloj atrasado)', () => {
    expect(cell('2026-11-28')?.summary).toBeNull()
  })
})

describe('recordedYears', () => {
  it('lista los años con historial', () => {
    expect(recordedYears(data, '2026-11-27')).toEqual([2025, 2026])
  })

  it('incluye siempre el año actual', () => {
    expect(recordedYears(dataWith({}), '2027-01-01')).toEqual([2027])
  })

  it('no ofrece años posteriores a hoy', () => {
    expect(recordedYears(data, '2025-12-31')).toEqual([2025])
  })
})

describe('fitGrid', () => {
  const fits = (count: number, width: number, height: number, gap: number) => {
    const grid = fitGrid(count, width, height, gap)
    if (!grid) throw new Error('No cabe')
    expect(grid.columns * grid.rows).toBeGreaterThanOrEqual(count)
    expect(grid.columns * grid.cellSize + gap * (grid.columns - 1)).toBeLessThanOrEqual(
      width + 1e-9,
    )
    expect(grid.rows * grid.cellSize + gap * (grid.rows - 1)).toBeLessThanOrEqual(height + 1e-9)
    return grid
  }

  it('reparte el año en unas 15 × 25 casillas en un móvil', () => {
    expect(fits(365, 361, 600, 3)).toMatchObject({ columns: 15, rows: 25 })
  })

  it.each([
    [365, 288, 450, 2],
    [366, 361, 600, 3],
    [366, 760, 380, 3],
    [365, 1000, 1400, 4],
  ])('caben %i casillas en %i × %i', (count, width, height, gap) => {
    fits(count, width, height, gap)
  })

  it('ninguna otra distribución permite casillas más grandes', () => {
    const best = fits(366, 361, 600, 3)

    for (let columns = 1; columns <= 366; columns += 1) {
      const rows = Math.ceil(366 / columns)
      const size = Math.min((361 - 3 * (columns - 1)) / columns, (600 - 3 * (rows - 1)) / rows)
      expect(size).toBeLessThanOrEqual(best.cellSize)
    }
  })

  it.each([
    [0, 361, 600],
    [365, 0, 600],
    [365, 361, 0],
    [365, 20, 20],
  ])('devuelve nada si no hay sitio (%i en %i × %i)', (count, width, height) => {
    expect(fitGrid(count, width, height, 3)).toBeNull()
  })
})
