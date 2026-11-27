import { describe, expect, it } from 'vitest'
import { encodeDocument } from '../data/document'
import { createRepository, DATA_KEY } from '../data/repository'
import type { KeyValueStorage } from '../data/storage'
import { memoryStorage, SAMPLE } from '../data/testing'
import { preset } from '../domain/testing'
import { createAppStore } from './appStore'

const FRIDAY = new Date(2026, 10, 27, 12)
const SATURDAY = new Date(2026, 10, 28, 0, 0, 5)

function setup(storage: KeyValueStorage = memoryStorage()) {
  const clock = { now: FRIDAY }
  const store = createAppStore(createRepository(storage), () => clock.now)
  return { store, clock, state: () => store.getState() }
}

async function ready(storage = memoryStorage()) {
  const context = setup(storage)
  await context.state().load()
  return { ...context, storage }
}

const stored = (storage: { entries: Map<string, string> }) =>
  JSON.parse(storage.entries.get(DATA_KEY) ?? '{}') as { days: Record<string, unknown> }

/** Espera a que se resuelvan las escrituras pendientes. */
const settle = () => new Promise((resolve) => setTimeout(resolve))

describe('load', () => {
  it('empieza cargando', () => {
    expect(setup().state().status).toBe('loading')
  })

  it('deja la app lista con el día de hoy registrado y guardado', async () => {
    const { state, storage } = await ready()
    await settle()

    expect(state()).toMatchObject({ status: 'ready', today: '2026-11-27', saveFailed: false })
    expect(stored(storage).days).toHaveProperty('2026-11-27')
  })

  it('rellena los días que faltaban', async () => {
    const storage = memoryStorage({ [DATA_KEY]: encodeDocument(SAMPLE) })
    const { clock, state } = setup(storage)
    clock.now = new Date(2026, 10, 30, 9)

    await state().load()

    expect(Object.keys(state().data.days)).toContain('2026-11-29')
  })

  it.each([
    ['corrupt', 'roto'],
    ['unsupported', '{"schemaVersion":99}'],
  ])('informa de datos %s sin tocarlos', async (status, raw) => {
    const storage = memoryStorage({ [DATA_KEY]: raw })
    const { state } = setup(storage)

    await state().load()

    expect(state().status).toBe(status)
    expect(storage.entries.get(DATA_KEY)).toBe(raw)
  })

  it('informa de un fallo de lectura y permite reintentar', async () => {
    const memory = memoryStorage()
    let fail = true
    const { state } = setup({
      get: (key) => (fail ? Promise.reject(new Error('sin acceso')) : memory.get(key)),
      set: memory.set,
    })

    await state().load()
    expect(state().status).toBe('load-error')

    fail = false
    await state().load()
    expect(state().status).toBe('ready')
  })

  it('no admite cambios hasta estar lista', () => {
    const { state } = setup()

    expect(state().addGoal(preset('read'))).toBeNull()
    state().toggle('g1')
    state().refreshDay()

    expect(state().data.goals).toEqual([])
  })
})

describe('cambios', () => {
  it('añade, marca y guarda', async () => {
    const { state, storage } = await ready()

    expect(state().addGoal(preset('read'))).toBeNull()
    state().toggle('g1')
    await settle()

    expect(state().data.days['2026-11-27']?.done).toEqual(['g1'])
    expect(stored(storage).days['2026-11-27']).toEqual({ scheduled: ['g1'], done: ['g1'] })
  })

  it('devuelve el motivo de un rechazo sin cambiar nada', async () => {
    const { state } = await ready()
    state().addGoal(preset('read'))
    const before = state().data

    expect(state().addGoal(preset('read'))).toBe('duplicate')
    expect(state().data).toBe(before)
  })

  it('edita y quita metas', async () => {
    const { state } = await ready()
    state().addGoal(preset('read'))

    expect(state().updateGoal('g1', preset('read', [1]))).toBeNull()
    expect(state().data.goals[0]?.weekdays).toEqual([1])

    expect(state().removeGoal('g1')).toBeNull()
    expect(state().removeGoal('g1')).toBe('not-found')
  })

  it('no marca nada si el día ha cambiado desde lo que se veía en pantalla', async () => {
    const { state, clock } = await ready()
    state().addGoal(preset('read'))

    clock.now = SATURDAY
    state().toggle('g1')

    expect(state().today).toBe('2026-11-28')
    expect(state().data.days['2026-11-28']?.done).toEqual([])
    expect(state().data.days['2026-11-27']?.done).toEqual([])

    state().toggle('g1')
    expect(state().data.days['2026-11-28']?.done).toEqual(['g1'])
  })

  it('ignora marcar una meta que hoy no toca', async () => {
    const { state } = await ready()
    state().addGoal(preset('read', [1]))
    const before = state().data

    state().toggle('g1')

    expect(state().data).toBe(before)
  })
})

describe('refreshDay', () => {
  it('registra el día nuevo y lo guarda', async () => {
    const { state, clock, storage } = await ready()

    clock.now = SATURDAY
    state().refreshDay()
    await settle()

    expect(state().today).toBe('2026-11-28')
    expect(stored(storage).days).toHaveProperty('2026-11-28')
  })

  it('nunca muestra el día nuevo sin su registro', async () => {
    const { store, state, clock } = await ready()
    const complete: boolean[] = []
    store.subscribe(({ data, today }) => complete.push(data.days[today] !== undefined))

    clock.now = SATURDAY
    state().refreshDay()

    expect(complete.length).toBeGreaterThan(0)
    expect(complete).not.toContain(false)
  })

  it('no cambia los datos si sigue siendo el mismo día', async () => {
    const { state } = await ready()
    const before = state().data

    state().refreshDay()

    expect(state().data).toBe(before)
  })
})

describe('fallos de escritura', () => {
  const failing = () => {
    const memory = memoryStorage()
    const control = { fail: false }
    const storage = {
      entries: memory.entries,
      get: memory.get,
      set: (key: string, value: string) =>
        control.fail ? Promise.reject(new Error('disco lleno')) : memory.set(key, value),
    }
    return { storage, control }
  }

  it('se comunican, conservan el cambio en pantalla y se pueden reintentar', async () => {
    const { storage, control } = failing()
    const { state } = await ready(storage)
    await settle()
    control.fail = true

    state().addGoal(preset('read'))
    await settle()

    expect(state().saveFailed).toBe(true)
    expect(state().data.goals).toHaveLength(1)

    control.fail = false
    state().retrySave()
    await settle()

    expect(state().saveFailed).toBe(false)
    expect(storage.entries.get(DATA_KEY)).toContain('"preset":"read"')
  })
})

describe('startOver', () => {
  it('empieza de cero tras datos dañados', async () => {
    const { state } = setup(memoryStorage({ [DATA_KEY]: 'roto' }))
    await state().load()

    await state().startOver()

    expect(state()).toMatchObject({ status: 'ready', today: '2026-11-27', saveFailed: false })
    expect(state().data.days).toHaveProperty('2026-11-27')
  })

  it('si no se puede escribir lo comunica y sigue donde estaba', async () => {
    const memory = memoryStorage({ [DATA_KEY]: 'roto', [`${DATA_KEY}.corrupt.1`]: 'roto' })
    const { state } = setup({
      get: memory.get,
      set: () => Promise.reject(new Error('disco lleno')),
    })
    await state().load()

    await state().startOver()

    expect(state()).toMatchObject({ status: 'corrupt', saveFailed: true })
  })
})
