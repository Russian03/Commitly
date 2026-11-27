import { beforeEach, describe, expect, it } from 'vitest'
import { preferencesStorage } from './preferencesStorage'

// En las pruebas se usa la versión web real del plugin, que guarda en localStorage.
beforeEach(() => {
  localStorage.clear()
})

describe('preferencesStorage', () => {
  it('devuelve null si no hay nada', async () => {
    expect(await preferencesStorage.get('commitly.data')).toBeNull()
  })

  it('lee lo que ha escrito', async () => {
    await preferencesStorage.set('commitly.data', '{"a":1}')

    expect(await preferencesStorage.get('commitly.data')).toBe('{"a":1}')
  })

  it('conserva un texto vacío', async () => {
    await preferencesStorage.set('commitly.data', '')

    expect(await preferencesStorage.get('commitly.data')).toBe('')
  })
})
