import { describe, expect, it } from 'vitest'
import { addGoal, removeGoal, toggleGoal } from './actions'
import { createEmptyData } from './appData'
import { goalsForDay, goalsNotOnDay } from './selectors'
import { preset, unwrap } from './testing'

const FRIDAY = '2026-11-27'

const build = () => {
  const read = unwrap(addGoal(createEmptyData(), FRIDAY, preset('read')))
  const study = unwrap(addGoal(read, FRIDAY, preset('study', [1])))
  const water = unwrap(addGoal(study, FRIDAY, preset('water')))
  return unwrap(toggleGoal(water, FRIDAY, 'g1'))
}

describe('goalsForDay', () => {
  it('lista las metas del día, las más nuevas primero, con su estado', () => {
    expect(goalsForDay(build(), FRIDAY).map(({ goal, done }) => [goal.id, done])).toEqual([
      ['g3', false],
      ['g1', true],
    ])
  })

  it('muestra en el pasado las metas que después se quitaron', () => {
    const data = unwrap(removeGoal(build(), '2026-11-28', 'g1'))

    expect(goalsForDay(data, FRIDAY).map(({ goal }) => goal.id)).toEqual(['g3', 'g1'])
  })

  it('devuelve una lista vacía para un día sin registro', () => {
    expect(goalsForDay(build(), '2026-01-01')).toEqual([])
  })
})

describe('goalsNotOnDay', () => {
  it('lista las metas activas que ese día no tocan', () => {
    expect(goalsNotOnDay(build(), FRIDAY).map((goal) => goal.id)).toEqual(['g2'])
  })

  it('en un día sin registro lista todas las activas', () => {
    expect(goalsNotOnDay(build(), '2026-01-01').map((goal) => goal.id)).toEqual(['g3', 'g2', 'g1'])
  })

  it('no incluye las quitadas', () => {
    const data = unwrap(removeGoal(build(), FRIDAY, 'g2'))

    expect(goalsNotOnDay(data, FRIDAY)).toEqual([])
  })
})
