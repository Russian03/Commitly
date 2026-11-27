import { describe, expect, it } from 'vitest'
import { resolveLanguage } from './language'

describe('resolveLanguage', () => {
  it.each([
    [['es-ES'], 'es'],
    [['es-419', 'en-US'], 'es'],
    [['EN-gb'], 'en'],
    [['ca-ES', 'es-ES'], 'es'],
    [['fr-FR', 'en-US', 'es-ES'], 'en'],
    [['fr-FR'], 'en'],
    [[], 'en'],
  ])('con %j usa %s', (preferred, language) => {
    expect(resolveLanguage(preferred)).toBe(language)
  })
})
