import { afterEach, describe, expect, it, vi } from 'vitest'
import { addDays, daysBetween, daysOfYear, parseDayKey, toDayKey, weekdayOf, yearOf } from './date'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('toDayKey', () => {
  it('usa la fecha local, no la UTC', () => {
    vi.stubEnv('TZ', 'Europe/Madrid')
    const justAfterMidnight = new Date('2026-11-26T23:30:00Z')

    expect(toDayKey(justAfterMidnight)).toBe('2026-11-27')
  })

  it('al oeste de Greenwich devuelve el día anterior para el mismo instante', () => {
    vi.stubEnv('TZ', 'America/New_York')

    expect(toDayKey(new Date('2026-11-27T02:00:00Z'))).toBe('2026-11-26')
  })

  it('rellena con ceros el mes y el día', () => {
    expect(toDayKey(new Date(2027, 0, 5, 12))).toBe('2027-01-05')
  })

  it('rechaza una fecha no válida', () => {
    expect(() => toDayKey(new Date('nada'))).toThrow(RangeError)
  })
})

describe('parseDayKey', () => {
  it.each(['2026-11-27', '2028-02-29', '1970-01-01', '9999-12-31'])('admite %s', (value) => {
    expect(parseDayKey(value)).toBe(value)
  })

  it.each([
    '2027-02-29',
    '2026-13-01',
    '2026-00-10',
    '2026-04-31',
    '2026-1-1',
    '2026-11-27T00:00:00Z',
    '0099-01-01',
    '9999-12-32',
    '9999-13-01',
    '__proto__',
    '',
  ])('rechaza «%s»', (value) => {
    expect(parseDayKey(value)).toBeNull()
  })
})

describe('addDays', () => {
  it.each([
    ['2026-12-31', 1, '2027-01-01'],
    ['2027-01-01', -1, '2026-12-31'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2027-02-28', 1, '2027-03-01'],
    ['2026-11-27', 0, '2026-11-27'],
  ] as const)('%s + %i = %s', (from, amount, expected) => {
    expect(addDays(from, amount)).toBe(expected)
  })

  it.each(['Europe/Madrid', 'America/Santiago', 'Australia/Lord_Howe'])(
    'no salta ni repite días con los cambios de hora de %s',
    (zone) => {
      vi.stubEnv('TZ', zone)
      // Comprueba que la zona se aplica y tiene cambio de hora: si no, la prueba no probaría nada.
      expect(new Date(2027, 0, 1).getTimezoneOffset()).not.toBe(
        new Date(2027, 6, 1).getTimezoneOffset(),
      )

      let day = parseDayKey('2027-01-01')
      const seen = new Set<string>()
      for (let index = 0; index < 365 && day; index += 1) {
        seen.add(day)
        const next = addDays(day, 1)
        expect(daysBetween(day, next)).toBe(1)
        day = next
      }

      expect(seen.size).toBe(365)
      expect(day).toBe('2028-01-01')
    },
  )

  it('falla si el resultado se sale del calendario admitido', () => {
    expect(() => addDays('9999-12-31', 1)).toThrow(RangeError)
  })
})

describe('daysBetween', () => {
  it('cuenta con signo', () => {
    expect(daysBetween('2026-11-27', '2026-12-01')).toBe(4)
    expect(daysBetween('2026-12-01', '2026-11-27')).toBe(-4)
  })
})

describe('weekdayOf', () => {
  it.each([
    ['2026-11-23', 1],
    ['2026-11-27', 5],
    ['2026-11-29', 7],
    ['1970-01-01', 4],
  ] as const)('%s es el día %i de la semana', (day, weekday) => {
    expect(weekdayOf(day)).toBe(weekday)
  })
})

describe('daysOfYear', () => {
  it('tiene 365 días en un año normal', () => {
    const days = daysOfYear(2027)

    expect(days).toHaveLength(365)
    expect(days[0]).toBe('2027-01-01')
    expect(days.slice(-1)).toEqual(['2027-12-31'])
  })

  it('tiene 366 días en 2028', () => {
    const days = daysOfYear(2028)

    expect(days).toHaveLength(366)
    expect(days).toContain('2028-02-29')
  })
})

describe('yearOf', () => {
  it('devuelve el año del día', () => {
    expect(yearOf('2028-02-29')).toBe(2028)
  })
})
