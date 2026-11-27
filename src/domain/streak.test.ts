import { describe, expect, it } from 'vitest'
import { currentStreak } from './streak'
import { dataWith, record } from './testing'

const perfect = record(['g1'], ['g1'])
const missed = record(['g1'])
const rest = record([])

describe('currentStreak', () => {
  it('sin historial es cero', () => {
    expect(currentStreak(dataWith({}), '2026-11-27')).toBe(0)
  })

  it('cuenta días perfectos seguidos, incluido hoy', () => {
    const data = dataWith({
      days: { '2026-11-25': perfect, '2026-11-26': perfect, '2026-11-27': perfect },
    })

    expect(currentStreak(data, '2026-11-27')).toBe(3)
  })

  it('hoy sin terminar no la rompe ni suma', () => {
    const data = dataWith({
      days: { '2026-11-25': perfect, '2026-11-26': perfect, '2026-11-27': missed },
    })

    expect(currentStreak(data, '2026-11-27')).toBe(2)
  })

  it('un día fallado la rompe', () => {
    const data = dataWith({
      days: { '2026-11-25': perfect, '2026-11-26': missed, '2026-11-27': perfect },
    })

    expect(currentStreak(data, '2026-11-27')).toBe(1)
  })

  it('los días libres ni la rompen ni suman', () => {
    const data = dataWith({
      days: {
        '2026-11-24': perfect,
        '2026-11-25': rest,
        '2026-11-26': rest,
        '2026-11-27': rest,
      },
    })

    expect(currentStreak(data, '2026-11-27')).toBe(1)
  })

  it('un hueco en el historial la rompe', () => {
    const data = dataWith({ days: { '2026-11-24': perfect, '2026-11-26': perfect } })

    expect(currentStreak(data, '2026-11-26')).toBe(1)
  })

  it('ignora los días posteriores a hoy', () => {
    const data = dataWith({ days: { '2026-11-26': perfect, '2026-11-27': perfect } })

    expect(currentStreak(data, '2026-11-26')).toBe(1)
  })
})
