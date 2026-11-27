import { describe, expect, it } from 'vitest'
import { createI18n } from '../../i18n/i18n'
import { goalName, scheduleSummary, weekdayName } from './goalText'

const es = createI18n('es')
const en = createI18n('en')

describe('goalName', () => {
  it('traduce las metas de ejemplo', () => {
    expect(goalName({ kind: 'preset', preset: 'water' }, es.t)).toBe('Beber 2 L de agua')
    expect(goalName({ kind: 'preset', preset: 'water' }, en.t)).toBe('Drink 2 L of water')
  })

  it('respeta el nombre de las propias', () => {
    expect(goalName({ kind: 'custom', title: 'Pintar' }, en.t)).toBe('Pintar')
  })
})

describe('weekdayName', () => {
  it.each([
    [1, 'es', 'long', 'Lunes'],
    [3, 'es', 'narrow', 'X'],
    [7, 'es', 'short', 'Dom'],
    [1, 'en', 'long', 'Monday'],
  ] as const)('día %i en %s (%s) es %s', (day, language, width, name) => {
    expect(weekdayName(day, language, width)).toBe(name)
  })
})

describe('scheduleSummary', () => {
  it.each([
    [[1, 2, 3, 4, 5, 6, 7], 'Cada día'],
    [[1, 2, 3, 4, 5], 'Entre semana'],
    [[6, 7], 'Fines de semana'],
    [[1, 3, 5], 'Lun, mié, vie'],
    [[2], 'Mar'],
  ] as const)('%j se resume como «%s»', (weekdays, summary) => {
    expect(scheduleSummary(weekdays, es.t, 'es')).toBe(summary)
  })
})
