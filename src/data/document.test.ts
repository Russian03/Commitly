import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmptyData } from '../domain/appData'
import { decodeDocument, encodeDocument, migrate } from './document'
import { SAMPLE } from './testing'

const document = (changes: Record<string, unknown> = {}) =>
  JSON.stringify({ schemaVersion: 1, ...SAMPLE, ...changes })

const withGoal = (changes: Record<string, unknown>) =>
  document({ goals: [{ ...SAMPLE.goals[0], ...changes }, SAMPLE.goals[1]] })

const withDay = (day: string, record: unknown) =>
  document({ days: { ...SAMPLE.days, [day]: record } })

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('encodeDocument', () => {
  it('lo guardado se vuelve a leer igual', () => {
    expect(decodeDocument(encodeDocument(SAMPLE))).toEqual({ status: 'ok', data: SAMPLE })
    expect(decodeDocument(encodeDocument(createEmptyData()))).toEqual({
      status: 'ok',
      data: createEmptyData(),
    })
  })

  it('anota la versión del esquema', () => {
    expect(JSON.parse(encodeDocument(SAMPLE))).toMatchObject({ schemaVersion: 1 })
  })

  it('se niega a guardar datos incoherentes', () => {
    expect(() => encodeDocument({ ...SAMPLE, nextGoalNumber: 1 })).toThrow()
  })
})

describe('decodeDocument', () => {
  it.each([
    ['texto que no es JSON', '{"schemaVersion":'],
    ['un texto vacío', ''],
    ['una lista', '[]'],
    ['null', 'null'],
    ['sin versión', JSON.stringify(SAMPLE)],
    ['una versión que no es un número', document({ schemaVersion: '1' })],
    ['una versión cero', document({ schemaVersion: 0 })],
    ['un campo desconocido', document({ extra: true })],
    ['faltan las metas', document({ goals: undefined })],
    ['una meta de ejemplo desconocida', withGoal({ content: { kind: 'preset', preset: 'x' } })],
    ['un título vacío', withGoal({ content: { kind: 'custom', title: ' ' } })],
    ['un título sin limpiar', withGoal({ content: { kind: 'custom', title: ' Pintar' } })],
    ['un título largo', withGoal({ content: { kind: 'custom', title: 'a'.repeat(41) } })],
    ['ningún día de la semana', withGoal({ weekdays: [] })],
    ['un día de la semana imposible', withGoal({ weekdays: [8] })],
    ['días de la semana repetidos', withGoal({ weekdays: [1, 1] })],
    ['días de la semana desordenados', withGoal({ weekdays: [5, 1] })],
    ['un identificador mal formado', withGoal({ id: 'meta' })],
    ['identificadores repetidos', withGoal({ id: 'g1' })],
    ['una fecha de baja imposible', withGoal({ removedOn: '2027-02-29' })],
    ['un contador que repetiría identificadores', document({ nextGoalNumber: 2 })],
    ['una fecha que se sale del calendario', withDay('9999-12-32', { scheduled: [], done: [] })],
    ['un día que no existe', withDay('2026-02-30', { scheduled: [], done: [] })],
    ['una clave que no es un día', document({ days: { ayer: { scheduled: [], done: [] } } })],
    ['una meta del día que no existe', withDay('2026-11-27', { scheduled: ['g9'], done: [] })],
    ['una meta repetida en un día', withDay('2026-11-27', { scheduled: ['g1', 'g1'], done: [] })],
    ['una cumplida que no tocaba', withDay('2026-11-27', { scheduled: ['g2'], done: ['g1'] })],
    ['una cumplida repetida', withDay('2026-11-27', { scheduled: ['g2'], done: ['g2', 'g2'] })],
  ])('marca como dañado: %s', (_, raw) => {
    expect(decodeDocument(raw)).toEqual({ status: 'corrupt' })
  })

  it('rechaza un día con más de 12 metas', () => {
    const goals = Array.from({ length: 13 }, (_, index) => ({
      ...SAMPLE.goals[0],
      id: `g${index + 1}`,
    }))
    const raw = document({
      goals,
      days: { '2026-11-27': { scheduled: goals.map((goal) => goal.id), done: [] } },
      nextGoalNumber: 14,
    })

    expect(decodeDocument(raw)).toEqual({ status: 'corrupt' })
  })

  it('reconoce datos de una versión más nueva de la app', () => {
    expect(decodeDocument(document({ schemaVersion: 2, algo: 'nuevo' }))).toEqual({
      status: 'unsupported',
      version: 2,
    })
  })

  it('no evalúa código: la política de seguridad de la app lo prohíbe', async () => {
    const evaluator = vi.fn(function () {
      throw new EvalError('bloqueado')
    })
    vi.resetModules()
    vi.stubGlobal('Function', evaluator)

    const fresh = await import('./document')

    expect(fresh.decodeDocument(document()).status).toBe('ok')
    expect(evaluator).not.toHaveBeenCalled()
  })
})

describe('migrate', () => {
  const steps = {
    1: (doc: Record<string, unknown>) => ({ ...doc, b: 2 }),
    2: (doc: Record<string, unknown>) => ({ ...doc, c: 3 }),
  }

  it('aplica en orden los pasos que faltan y actualiza la versión', () => {
    expect(migrate({ schemaVersion: 1, a: 1 }, 1, 3, steps)).toEqual({
      schemaVersion: 3,
      a: 1,
      b: 2,
      c: 3,
    })
  })

  it('no hace nada si ya está al día', () => {
    const doc = { schemaVersion: 3 }

    expect(migrate(doc, 3, 3, steps)).toBe(doc)
  })

  it('falla si falta un paso', () => {
    expect(migrate({ schemaVersion: 1 }, 1, 3, { 1: steps[1] })).toBeNull()
  })

  it('falla si un paso revienta', () => {
    const broken = () => {
      throw new Error('mal')
    }

    expect(migrate({ schemaVersion: 1 }, 1, 2, { 1: broken })).toBeNull()
  })
})
