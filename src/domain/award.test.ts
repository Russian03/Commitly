import { describe, expect, it } from 'vitest'
import { todayAward } from './award'
import type { AppData } from './appData'
import { createEmptyData } from './appData'
import { addDays } from './date'
import type { Goal, GoalId } from './goal'
import { dataWith, EVERY_DAY, record } from './testing'

const TODAY = '2026-11-27'
const YESTERDAY = '2026-11-26'

const goal = (id: GoalId, removedOn: Goal['removedOn'] = null): Goal => ({
  id,
  content: { kind: 'custom', title: id },
  weekdays: EVERY_DAY,
  removedOn,
})

const ids: GoalId[] = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6']

/** Hoy tocan `total` metas y se han cumplido las `done` primeras. */
const withToday = (done: number, total: number) =>
  dataWith({
    goals: ids.slice(0, total).map((id) => goal(id)),
    days: { [TODAY]: record(ids.slice(0, total), ids.slice(0, done)) },
  })

/** Pasadas las 8:00, que es como se ve casi todo el día. */
const award = (data: AppData) => todayAward(data, TODAY, YESTERDAY)

describe('todayAward: estado del día', () => {
  it('sin ninguna meta', () => {
    expect(award(createEmptyData()).state).toBe('no-goals')
  })

  it('con todas las metas quitadas', () => {
    const data = dataWith({
      goals: [goal('g1', '2026-11-20')],
      days: { [TODAY]: record([]) },
    })

    expect(award(data).state).toBe('no-goals')
  })

  it('con metas pero ninguna para hoy es un día libre', () => {
    const data = dataWith({ goals: [goal('g1')], days: { [TODAY]: record([]) } })

    expect(award(data).state).toBe('rest')
  })

  it.each([
    [0, 3, 'pending'],
    [1, 3, 'partial'],
    [3, 3, 'perfect'],
  ])('con %i de %i metas está en «%s»', (done, total, state) => {
    expect(award(withToday(done, total)).state).toBe(state)
  })
})

describe('todayAward: puntos de hoy', () => {
  it('resume las metas y los puntos de hoy', () => {
    expect(award(withToday(2, 2))).toMatchObject({
      day: { done: 2, total: 2, level: 1, points: 30 },
      earned: 30,
    })
  })

  it('no suma al nivel lo de hoy hasta mañana', () => {
    expect(award(withToday(2, 2))).toMatchObject({ points: 0, pending: 0 })
  })

  it('cuenta en lo de hoy los logros que se alcanzan hoy', () => {
    const days = Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [addDays(TODAY, -i), record(['g1'], ['g1'])]),
    )

    const result = award(dataWith({ goals: [goal('g1')], days }))

    // Los 15 del día, 100 del logro de la meta y 200 del de días perfectos.
    expect(result.earned).toBe(315)
    expect(result.points).toBe(135)
  })
})

describe('todayAward: nivel', () => {
  const history = dataWith({
    goals: ids.map((id) => goal(id)),
    days: {
      '2026-11-25': record(ids, ids),
      '2026-11-26': record(ids, ids),
      [TODAY]: record(ids, ids.slice(0, 1)),
    },
  })

  it('desde las 8:00 cuenta hasta ayer', () => {
    const result = todayAward(history, TODAY, YESTERDAY)

    // Dos días perfectos de 6 metas, 90 puntos cada uno.
    expect(result.points).toBe(180)
    expect(result.pending).toBe(0)
    expect(result.progress).toEqual({ level: 2, current: 80, required: 200 })
  })

  it('antes de las 8:00 lo de ayer está pendiente', () => {
    const result = todayAward(history, TODAY, '2026-11-25')

    expect(result.points).toBe(90)
    expect(result.pending).toBe(90)
    expect(result.progress).toEqual({ level: 1, current: 90, required: 100 })
  })

  it('empieza en el nivel 1 sin puntos', () => {
    expect(award(createEmptyData())).toMatchObject({
      points: 0,
      pending: 0,
      earned: 0,
      progress: { level: 1, current: 0, required: 100 },
      perfect: { current: 0, best: 0, total: 0 },
      goals: [],
    })
  })
})

describe('todayAward: rachas y logros', () => {
  const data = dataWith({
    goals: [goal('g3', '2026-11-27'), goal('g2'), goal('g1')],
    days: {
      '2026-11-26': record(['g1', 'g2', 'g3'], ['g1', 'g3']),
      [TODAY]: record(['g1', 'g2'], ['g1', 'g2']),
    },
  })

  it('da la racha de cada meta activa, en el orden de la lista', () => {
    expect(award(data).goals.map(({ goal, run }) => [goal.id, run.current])).toEqual([
      ['g2', 1],
      ['g1', 2],
    ])
  })

  it('incluye las metas que hoy no tocan', () => {
    const resting = dataWith({ goals: [goal('g1')], days: { [TODAY]: record([]) } })

    expect(award(resting).goals).toHaveLength(1)
  })

  it('premia con 10 puntos por día los logros de meta y con 20 los de días perfectos', () => {
    const result = award(data)

    expect(result.goals[0]?.achievements[0]).toMatchObject({ days: 10, reward: 100 })
    expect(result.milestones[0]).toMatchObject({ days: 10, reward: 200 })
  })

  it('lleva la cuenta de los días perfectos', () => {
    expect(award(data).perfect).toEqual({ current: 1, best: 1, total: 1 })
  })
})
