import { describe, expect, it } from 'vitest'
import { creditedThrough, dayPoints, levelProgress, totalPoints } from './points'
import { dataWith, record } from './testing'

describe('dayPoints', () => {
  it.each([
    [0, 0, 0],
    [0, 3, 0],
    [1, 2, 10],
    [2, 2, 30],
    [5, 6, 50],
    [6, 6, 90],
    [12, 12, 180],
  ])('%i de %i metas suman %i puntos', (done, total, points) => {
    expect(dayPoints(done, total)).toBe(points)
  })
})

describe('totalPoints', () => {
  const data = dataWith({
    days: {
      '2026-11-26': record(['g1', 'g2'], ['g1', 'g2']),
      '2026-11-27': record(['g1', 'g2'], ['g1']),
      '2026-11-28': record(['g1'], ['g1']),
    },
  })

  it('suma los días hasta el indicado', () => {
    expect(totalPoints(data, '2026-11-27')).toBe(40)
  })

  it('no cuenta días posteriores (reloj atrasado)', () => {
    expect(totalPoints(data, '2026-11-26')).toBe(30)
    expect(totalPoints(data, '2026-11-28')).toBe(55)
  })

  it('sin historial no hay puntos', () => {
    expect(totalPoints(dataWith({}), '2026-11-27')).toBe(0)
  })
})

describe('creditedThrough', () => {
  // Cada fila: momento (mes de 0 a 11) y último día cuyos puntos ya cuentan.
  it.each([
    [new Date(2026, 10, 27, 0, 0), '2026-11-25'],
    [new Date(2026, 10, 27, 7, 59, 59), '2026-11-25'],
    [new Date(2026, 10, 27, 8, 0), '2026-11-26'],
    [new Date(2026, 10, 27, 23, 59), '2026-11-26'],
    [new Date(2027, 0, 1, 7, 0), '2026-12-30'],
    [new Date(2027, 0, 1, 9, 0), '2026-12-31'],
    // Días de cambio de hora en Europa.
    [new Date(2027, 2, 28, 8, 0), '2027-03-27'],
    [new Date(2027, 9, 31, 7, 59), '2027-10-29'],
  ])('a las %s cuentan hasta el %s', (now, day) => {
    expect(creditedThrough(now)).toBe(day)
  })
})

describe('levelProgress', () => {
  it.each([
    [0, 1, 0, 100],
    [99, 1, 99, 100],
    [100, 2, 0, 200],
    [299, 2, 199, 200],
    [300, 3, 0, 300],
    [600, 4, 0, 400],
    [650, 4, 50, 400],
  ])('%i puntos: nivel %i con %i de %i', (points, level, current, required) => {
    expect(levelProgress(points)).toEqual({ level, current, required })
  })
})
