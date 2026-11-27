import { describe, expect, it } from 'vitest'
import { normalizeTitle, normalizeWeekdays, titleError } from './goal'

describe('normalizeTitle', () => {
  it('recorta y junta los espacios', () => {
    expect(normalizeTitle('  Tocar   la guitarra  ')).toBe('Tocar la guitarra')
  })

  it('convierte saltos de línea y caracteres de control en espacios', () => {
    expect(normalizeTitle('Pasear\nal\tperro\u0000ya')).toBe('Pasear al perro ya')
  })

  it('conserva emojis compuestos', () => {
    expect(normalizeTitle('Correr 🏃‍♀️')).toBe('Correr 🏃‍♀️')
  })
})

describe('titleError', () => {
  it.each(['', '​', '‍‍'])('un título sin nada visible está vacío', (title) => {
    expect(titleError(title)).toBe('title-empty')
  })

  it('admite 40 caracteres, contando cada emoji como uno', () => {
    expect(titleError('a'.repeat(40))).toBeNull()
    expect(titleError('🌱'.repeat(40))).toBeNull()
  })

  it('rechaza 41 caracteres', () => {
    expect(titleError('a'.repeat(41))).toBe('title-too-long')
  })
})

describe('normalizeWeekdays', () => {
  it('ordena y quita repetidos', () => {
    expect(normalizeWeekdays([5, 1, 5, 3])).toEqual([1, 3, 5])
  })
})
