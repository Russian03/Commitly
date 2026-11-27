import { describe, expect, it } from 'vitest'
import { colorCeiling, colorLevel } from './level'

describe('colorCeiling', () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 2],
    [5, 3],
    [6, 4],
    [12, 4],
  ])('con %i metas el nivel máximo es %i', (total, ceiling) => {
    expect(colorCeiling(total)).toBe(ceiling)
  })
})

describe('colorLevel', () => {
  it.each([
    [0, 0, 0],
    [0, 6, 0],
    [1, 12, 1],
    [1, 2, 1],
    [2, 2, 1],
    [3, 4, 1],
    [4, 4, 2],
    [5, 6, 3],
    [6, 6, 4],
    [12, 12, 4],
    [6, 12, 2],
  ])('%i de %i metas da el nivel %i', (done, total, level) => {
    expect(colorLevel(done, total)).toBe(level)
  })

  it('el nivel máximo solo se alcanza con todo cumplido', () => {
    for (let total = 3; total <= 12; total += 1) {
      expect(colorLevel(total, total)).toBe(colorCeiling(total))
      expect(colorLevel(total - 1, total)).toBeLessThan(colorCeiling(total))
    }
  })
})
