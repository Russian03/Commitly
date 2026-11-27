import { describe, expect, it } from 'vitest'
import { goalRun, perfectRun } from './runs'
import { dataWith, record } from './testing'

const done = record(['g1'], ['g1'])
const missed = record(['g1'])
/** Un día en el que no tocaba. */
const off = record([])

const TODAY = '2026-11-27'

describe('goalRun', () => {
  it('sin historial está a cero', () => {
    expect(goalRun(dataWith({}), TODAY, 'g1')).toEqual({ current: 0, best: 0, total: 0 })
  })

  it('cuenta los días cumplidos seguidos, incluido hoy', () => {
    const data = dataWith({
      days: { '2026-11-25': done, '2026-11-26': done, [TODAY]: done },
    })

    expect(goalRun(data, TODAY, 'g1')).toEqual({ current: 3, best: 3, total: 3 })
  })

  it('hoy sin marcar no la rompe ni suma', () => {
    const data = dataWith({
      days: { '2026-11-25': done, '2026-11-26': done, [TODAY]: missed },
    })

    expect(goalRun(data, TODAY, 'g1').current).toBe(2)
  })

  it('un día fallado la rompe, pero queda el récord', () => {
    const data = dataWith({
      days: {
        '2026-11-23': done,
        '2026-11-24': done,
        '2026-11-25': done,
        '2026-11-26': missed,
        [TODAY]: done,
      },
    })

    expect(goalRun(data, TODAY, 'g1')).toEqual({ current: 1, best: 3, total: 4 })
  })

  it('los días en que no tocaba ni la rompen ni suman', () => {
    const data = dataWith({
      days: { '2026-11-24': done, '2026-11-25': off, '2026-11-26': off, [TODAY]: off },
    })

    expect(goalRun(data, TODAY, 'g1').current).toBe(1)
  })

  it('cada meta lleva la suya', () => {
    const data = dataWith({
      days: {
        '2026-11-25': record(['g1', 'g2'], ['g1', 'g2']),
        '2026-11-26': record(['g1', 'g2'], ['g2']),
        [TODAY]: record(['g1', 'g2'], ['g1', 'g2']),
      },
    })

    expect(goalRun(data, TODAY, 'g1').current).toBe(1)
    expect(goalRun(data, TODAY, 'g2').current).toBe(3)
  })

  it('un hueco en el historial la rompe', () => {
    const data = dataWith({ days: { '2026-11-24': done, '2026-11-26': done } })

    expect(goalRun(data, '2026-11-26', 'g1')).toEqual({ current: 1, best: 1, total: 2 })
  })

  it('un hueco justo antes del día consultado la deja a cero', () => {
    const data = dataWith({ days: { '2026-11-24': done } })

    expect(goalRun(data, TODAY, 'g1')).toEqual({ current: 0, best: 1, total: 1 })
  })

  it('ignora los días posteriores y el orden en que estén guardados', () => {
    const data = dataWith({
      days: { [TODAY]: done, '2026-11-25': done, '2026-11-26': done },
    })

    expect(goalRun(data, '2026-11-26', 'g1')).toEqual({ current: 2, best: 2, total: 2 })
  })
})

describe('perfectRun', () => {
  const both = record(['g1', 'g2'], ['g1', 'g2'])
  const half = record(['g1', 'g2'], ['g1'])

  it('cuenta los días con todo cumplido', () => {
    const data = dataWith({
      days: {
        '2026-11-23': both,
        '2026-11-24': both,
        '2026-11-25': half,
        '2026-11-26': both,
        [TODAY]: half,
      },
    })

    expect(perfectRun(data, TODAY)).toEqual({ current: 1, best: 2, total: 3 })
  })

  it('los días libres ni la rompen ni suman', () => {
    const data = dataWith({
      days: { '2026-11-25': both, '2026-11-26': off, [TODAY]: both },
    })

    expect(perfectRun(data, TODAY)).toEqual({ current: 2, best: 2, total: 2 })
  })
})
