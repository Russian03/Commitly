import { describe, expect, it } from 'vitest'
import { dayPoints, levelProgress, totalPoints } from './points'
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

  it('suma los días hasta hoy', () => {
    expect(totalPoints(data, '2026-11-27')).toBe(40)
  })

  it('no cuenta días posteriores a hoy (reloj atrasado)', () => {
    expect(totalPoints(data, '2026-11-26')).toBe(30)
    expect(totalPoints(data, '2026-11-28')).toBe(55)
  })

  it('sin historial no hay puntos', () => {
    expect(totalPoints(dataWith({}), '2026-11-27')).toBe(0)
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
