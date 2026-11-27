import { describe, expect, it } from 'vitest'
import { addGoal, removeGoal, toggleGoal, updateGoal } from './actions'
import type { AppData } from './appData'
import { createEmptyData } from './appData'
import { MAX_GOALS_PER_DAY } from './goal'
import { reconcile } from './history'
import { custom, preset, record, unwrap } from './testing'

const FRIDAY = '2026-11-27'
const SATURDAY = '2026-11-28'

const withRead = (): AppData => unwrap(addGoal(createEmptyData(), FRIDAY, preset('read')))

describe('addGoal', () => {
  it('añade la meta arriba y la programa hoy', () => {
    const data = unwrap(addGoal(withRead(), FRIDAY, preset('water')))

    expect(data.goals.map((goal) => goal.id)).toEqual(['g2', 'g1'])
    expect(data.days[FRIDAY]).toEqual({ scheduled: ['g1', 'g2'], done: [] })
    expect(data.nextGoalNumber).toBe(3)
  })

  it('no la programa hoy si hoy no toca', () => {
    const data = unwrap(addGoal(createEmptyData(), FRIDAY, preset('read', [1])))

    expect(data.days[FRIDAY]?.scheduled).toEqual([])
  })

  it('guarda el título limpio y los días ordenados', () => {
    const data = unwrap(addGoal(createEmptyData(), FRIDAY, custom('  Pintar  ', [5, 1, 5])))

    expect(data.goals[0]).toEqual({
      id: 'g1',
      content: { kind: 'custom', title: 'Pintar' },
      weekdays: [1, 5],
      removedOn: null,
    })
  })

  it('no repinta los días anteriores', () => {
    const before = withRead()
    const data = unwrap(addGoal(before, SATURDAY, preset('water')))

    expect(data.days[FRIDAY]).toEqual({ scheduled: ['g1'], done: [] })
    expect(data.days[SATURDAY]?.scheduled).toEqual(['g1', 'g2'])
  })

  it('rellena los días pendientes con las metas de antes del cambio', () => {
    const data = unwrap(addGoal(withRead(), '2026-11-30', preset('water')))

    expect(data.days['2026-11-29']?.scheduled).toEqual(['g1'])
    expect(data.days['2026-11-30']?.scheduled).toEqual(['g1', 'g2'])
  })

  it('con el reloj atrasado también la añade a los días ya creados por delante', () => {
    const ahead = reconcile(withRead(), SATURDAY)

    const data = unwrap(addGoal(ahead, FRIDAY, preset('water')))

    expect(data.days[SATURDAY]?.scheduled).toEqual(['g1', 'g2'])
  })

  it.each([
    ['un título vacío', custom('   '), 'title-empty'],
    ['un título demasiado largo', custom('a'.repeat(41)), 'title-too-long'],
    ['ningún día', preset('water', []), 'no-weekdays'],
    ['un ejemplo repetido', preset('read'), 'duplicate'],
  ])('rechaza %s', (_, draft, error) => {
    expect(addGoal(withRead(), FRIDAY, draft)).toEqual({ ok: false, error })
  })

  it('rechaza un título propio repetido aunque cambien las mayúsculas', () => {
    const data = unwrap(addGoal(createEmptyData(), FRIDAY, custom('Pintar')))

    expect(addGoal(data, FRIDAY, custom('PINTAR'))).toEqual({ ok: false, error: 'duplicate' })
  })

  it(`admite como máximo ${MAX_GOALS_PER_DAY} metas en un mismo día`, () => {
    let data = createEmptyData()
    for (let index = 0; index < MAX_GOALS_PER_DAY; index += 1) {
      data = unwrap(addGoal(data, FRIDAY, custom(`Meta ${index}`, [5])))
    }

    expect(addGoal(data, FRIDAY, custom('Otra', [1, 5]))).toEqual({ ok: false, error: 'day-full' })
    expect(addGoal(data, FRIDAY, custom('Otra', [1])).ok).toBe(true)
  })
})

describe('toggleGoal', () => {
  it('marca y desmarca la meta de hoy', () => {
    const done = unwrap(toggleGoal(withRead(), FRIDAY, 'g1'))
    expect(done.days[FRIDAY]?.done).toEqual(['g1'])

    const undone = unwrap(toggleGoal(done, FRIDAY, 'g1'))
    expect(undone.days[FRIDAY]?.done).toEqual([])
  })

  it('pasada la medianoche marca en el día nuevo y deja el anterior igual', () => {
    const data = unwrap(toggleGoal(withRead(), SATURDAY, 'g1'))

    expect(data.days[FRIDAY]?.done).toEqual([])
    expect(data.days[SATURDAY]?.done).toEqual(['g1'])
  })

  it('rechaza una meta que hoy no toca', () => {
    const data = unwrap(addGoal(createEmptyData(), FRIDAY, preset('read', [1])))

    expect(toggleGoal(data, FRIDAY, 'g1')).toEqual({ ok: false, error: 'not-scheduled' })
  })

  it('rechaza una meta que no existe', () => {
    expect(toggleGoal(withRead(), FRIDAY, 'g9')).toEqual({ ok: false, error: 'not-found' })
  })
})

describe('removeGoal', () => {
  const twoDays = (): AppData => {
    const friday = unwrap(toggleGoal(withRead(), FRIDAY, 'g1'))
    return unwrap(toggleGoal(friday, SATURDAY, 'g1'))
  }

  it('la retira de hoy, aunque estuviera marcada, y conserva el pasado', () => {
    const data = unwrap(removeGoal(twoDays(), SATURDAY, 'g1'))

    expect(data.days[SATURDAY]).toEqual({ scheduled: [], done: [] })
    expect(data.days[FRIDAY]).toEqual(record(['g1'], ['g1']))
  })

  it('la archiva para no perder a qué se refería el historial', () => {
    const data = unwrap(removeGoal(twoDays(), SATURDAY, 'g1'))

    expect(data.goals).toEqual([expect.objectContaining({ id: 'g1', removedOn: SATURDAY })])
  })

  it('permite volver a añadirla como una meta nueva y sin marcar', () => {
    const removed = unwrap(removeGoal(twoDays(), SATURDAY, 'g1'))

    const data = unwrap(addGoal(removed, SATURDAY, preset('read')))

    expect(data.days[SATURDAY]).toEqual({ scheduled: ['g2'], done: [] })
  })

  it('rechaza quitar dos veces la misma meta', () => {
    const data = unwrap(removeGoal(withRead(), FRIDAY, 'g1'))

    expect(removeGoal(data, FRIDAY, 'g1')).toEqual({ ok: false, error: 'not-found' })
  })
})

describe('updateGoal', () => {
  it('cambia el título sin tocar lo marcado', () => {
    const added = unwrap(addGoal(createEmptyData(), FRIDAY, custom('Pintar')))
    const marked = unwrap(toggleGoal(added, FRIDAY, 'g1'))

    const data = unwrap(updateGoal(marked, FRIDAY, 'g1', custom('Dibujar')))

    expect(data.goals[0]?.content).toEqual({ kind: 'custom', title: 'Dibujar' })
    expect(data.days[FRIDAY]).toEqual(record(['g1'], ['g1']))
  })

  it('no toca las demás metas', () => {
    const two = unwrap(addGoal(withRead(), FRIDAY, preset('water')))

    const data = unwrap(updateGoal(two, FRIDAY, 'g2', preset('water', [1])))

    expect(data.goals.find((goal) => goal.id === 'g1')).toBe(
      two.goals.find((goal) => goal.id === 'g1'),
    )
    expect(data.days[FRIDAY]?.scheduled).toEqual(['g1'])
  })

  it('al quitar el día de hoy la retira de hoy y conserva el pasado', () => {
    const marked = unwrap(toggleGoal(withRead(), FRIDAY, 'g1'))
    const saturday = reconcile(marked, SATURDAY)

    const data = unwrap(updateGoal(saturday, SATURDAY, 'g1', preset('read', [1])))

    expect(data.days[SATURDAY]?.scheduled).toEqual([])
    expect(data.days[FRIDAY]).toEqual(record(['g1'], ['g1']))
  })

  it('al añadir el día de hoy la programa hoy', () => {
    const monday = unwrap(addGoal(createEmptyData(), FRIDAY, preset('read', [1])))

    const data = unwrap(updateGoal(monday, FRIDAY, 'g1', preset('read', [1, 5])))

    expect(data.days[FRIDAY]?.scheduled).toEqual(['g1'])
  })

  it('no se considera duplicada de sí misma', () => {
    expect(updateGoal(withRead(), FRIDAY, 'g1', preset('read', [5])).ok).toBe(true)
  })

  it('rechaza convertirla en otra que ya existe', () => {
    const data = unwrap(addGoal(withRead(), FRIDAY, preset('water')))

    expect(updateGoal(data, FRIDAY, 'g2', preset('read'))).toEqual({
      ok: false,
      error: 'duplicate',
    })
  })

  it('rechaza moverla a un día lleno', () => {
    let data = unwrap(addGoal(createEmptyData(), FRIDAY, preset('read', [1])))
    for (let index = 0; index < MAX_GOALS_PER_DAY; index += 1) {
      data = unwrap(addGoal(data, FRIDAY, custom(`Meta ${index}`, [5])))
    }

    expect(updateGoal(data, FRIDAY, 'g1', preset('read', [5]))).toEqual({
      ok: false,
      error: 'day-full',
    })
  })

  it('valida los datos nuevos', () => {
    expect(updateGoal(withRead(), FRIDAY, 'g1', preset('read', []))).toEqual({
      ok: false,
      error: 'no-weekdays',
    })
  })

  it('rechaza una meta que no existe', () => {
    expect(updateGoal(withRead(), FRIDAY, 'g9', preset('read'))).toEqual({
      ok: false,
      error: 'not-found',
    })
  })
})
