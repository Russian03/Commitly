import { describe, expect, it } from 'vitest'
import type { DayRecords } from './appData'
import { addDays } from './date'
import type { DayKey } from './date'
import { experience } from './experience'
import type { Goal } from './goal'
import { dataWith, EVERY_DAY, record } from './testing'

const goal: Goal = {
  id: 'g1',
  content: { kind: 'custom', title: 'Nadar' },
  weekdays: EVERY_DAY,
  removedOn: null,
}

const FIRST: DayKey = '2026-11-01'

/** `count` días seguidos con la única meta cumplida. */
function perfectDays(count: number): DayRecords {
  return Object.fromEntries(
    Array.from({ length: count }, (_, i) => [addDays(FIRST, i), record(['g1'], ['g1'])]),
  )
}

describe('experience', () => {
  it('sin historial es cero', () => {
    expect(experience(dataWith({}), FIRST)).toBe(0)
  })

  it('suma los puntos de cada día', () => {
    const data = dataWith({ goals: [goal], days: perfectDays(9) })

    expect(experience(data, addDays(FIRST, 8))).toBe(9 * 15)
  })

  it('al llegar a diez suma el logro de la meta y el de días perfectos', () => {
    const data = dataWith({ goals: [goal], days: perfectDays(10) })

    // 10 días × 15, logro de la meta (100) y logro de días perfectos (200).
    expect(experience(data, addDays(FIRST, 9))).toBe(150 + 100 + 200)
  })

  it('solo cuenta hasta el día indicado', () => {
    const data = dataWith({ goals: [goal], days: perfectDays(10) })

    expect(experience(data, addDays(FIRST, 8))).toBe(135)
  })

  it('conserva lo ganado por una meta que después se quitó', () => {
    const removed = { ...goal, removedOn: addDays(FIRST, 11) }
    const data = dataWith({
      goals: [removed],
      days: { ...perfectDays(10), [addDays(FIRST, 10)]: record([]) },
    })

    expect(experience(data, addDays(FIRST, 10))).toBe(450)
  })

  it('un logro no se pierde ni se repite al romper y rehacer la racha', () => {
    const days = {
      ...perfectDays(10),
      [addDays(FIRST, 10)]: record(['g1']),
      ...Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [addDays(FIRST, 11 + i), record(['g1'], ['g1'])]),
      ),
    }
    const data = dataWith({ goals: [goal], days })

    // 20 días de 15 puntos, un solo logro de meta y uno de días perfectos: van 20, no 25.
    expect(experience(data, addDays(FIRST, 20))).toBe(300 + 100 + 200)
  })
})
