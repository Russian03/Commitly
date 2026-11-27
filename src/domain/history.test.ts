import { describe, expect, it } from 'vitest'
import { createEmptyData } from './appData'
import { daysBetween } from './date'
import { MAX_BACKFILL_DAYS, reconcile } from './history'
import { dataWith, record } from './testing'

// Lectura todos los días; ejercicio solo lunes y viernes.
const data = dataWith({
  goals: [
    {
      id: 'g2',
      content: { kind: 'preset', preset: 'exercise' },
      weekdays: [1, 5],
      removedOn: null,
    },
    {
      id: 'g1',
      content: { kind: 'preset', preset: 'read' },
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      removedOn: null,
    },
    {
      id: 'g3',
      content: { kind: 'preset', preset: 'water' },
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      removedOn: '2026-11-20',
    },
  ],
  days: { '2026-11-26': record(['g1'], ['g1']) },
  nextGoalNumber: 4,
})

describe('reconcile', () => {
  it('en el primer uso crea solo el día de hoy', () => {
    const result = reconcile(createEmptyData(), '2026-11-27')

    expect(result.days).toEqual({ '2026-11-27': { scheduled: [], done: [] } })
  })

  it('crea el día nuevo con las metas activas de ese día de la semana', () => {
    const result = reconcile(data, '2026-11-27')

    expect(result.days['2026-11-27']).toEqual({ scheduled: ['g2', 'g1'], done: [] })
  })

  it('rellena los días sin abrir la app como no cumplidos', () => {
    const result = reconcile(data, '2026-11-30')

    expect(Object.keys(result.days).sort()).toEqual([
      '2026-11-26',
      '2026-11-27',
      '2026-11-28',
      '2026-11-29',
      '2026-11-30',
    ])
    expect(result.days['2026-11-28']).toEqual({ scheduled: ['g1'], done: [] })
    expect(result.days['2026-11-30']).toEqual({ scheduled: ['g2', 'g1'], done: [] })
  })

  it('no toca los días ya registrados', () => {
    expect(reconcile(data, '2026-11-30').days['2026-11-26']).toBe(data.days['2026-11-26'])
  })

  it('no cambia nada si hoy ya está registrado', () => {
    expect(reconcile(data, '2026-11-26')).toBe(data)
  })

  it('no modifica los datos de entrada', () => {
    reconcile(data, '2026-11-30')

    expect(Object.keys(data.days)).toEqual(['2026-11-26'])
  })

  it('con el reloj atrasado a un día sin registro, lo crea sin borrar los posteriores', () => {
    const result = reconcile(data, '2026-11-24')

    expect(result.days['2026-11-24']).toEqual({ scheduled: ['g1'], done: [] })
    expect(result.days['2026-11-26']).toEqual({ scheduled: ['g1'], done: ['g1'] })
    expect(Object.keys(result.days)).toHaveLength(2)
  })

  it('tras volver de un adelanto del reloj rellena desde el último día anterior a hoy', () => {
    const jumped = dataWith({
      ...data,
      days: { ...data.days, '2027-03-01': record(['g1']) },
    })

    const result = reconcile(jumped, '2026-11-28')

    expect(result.days['2026-11-27']).toBeDefined()
    expect(result.days['2026-11-28']).toBeDefined()
    expect(result.days['2027-03-01']).toBe(jumped.days['2027-03-01'])
    expect(Object.keys(result.days)).toHaveLength(4)
  })

  it('limita el relleno si el salto de fecha es enorme', () => {
    const result = reconcile(data, '2099-01-01')
    const days = Object.keys(result.days).sort()

    expect(days).toHaveLength(MAX_BACKFILL_DAYS + 1)
    expect(days.slice(-1)).toEqual(['2099-01-01'])
    expect(daysBetween(days[1] as `${number}-${number}-${number}`, '2099-01-01')).toBe(
      MAX_BACKFILL_DAYS - 1,
    )
  })

  it('no programa más de 12 metas en un día', () => {
    const crowded = dataWith({
      goals: Array.from({ length: 15 }, (_, index) => ({
        id: `g${index + 1}` as const,
        content: { kind: 'custom' as const, title: `Meta ${index + 1}` },
        weekdays: [5 as const],
        removedOn: null,
      })),
    })

    expect(reconcile(crowded, '2026-11-27').days['2026-11-27']?.scheduled).toHaveLength(12)
  })
})
