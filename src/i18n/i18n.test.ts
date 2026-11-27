import { afterEach, describe, expect, it, vi } from 'vitest'
import en from './en.json'
import es from './es.json'
import { createI18n, followDeviceLanguage } from './i18n'

function keysOf(tree: object, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]: [string, unknown]) =>
    typeof value === 'object' && value !== null
      ? keysOf(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )
}

function valuesOf(tree: object): unknown[] {
  return Object.values(tree).flatMap((value: unknown) =>
    typeof value === 'object' && value !== null ? valuesOf(value) : [value],
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('traducciones', () => {
  it('los dos idiomas tienen exactamente los mismos textos', () => {
    expect(keysOf(en).sort()).toEqual(keysOf(es).sort())
  })

  it.each([
    ['es', es],
    ['en', en],
  ])('no hay textos vacíos en %s', (_, translations) => {
    for (const value of valuesOf(translations)) expect(value).toMatch(/\S/)
  })
})

describe('createI18n', () => {
  it('traduce al momento, sin esperas', () => {
    expect(createI18n('es').t('nav.tasks')).toBe('Tareas')
    expect(createI18n('en').t('nav.tasks')).toBe('Tasks')
  })
})

describe('followDeviceLanguage', () => {
  it('marca el idioma del documento y sigue los cambios del móvil', async () => {
    const i18n = createI18n('es')
    const stop = followDeviceLanguage(i18n)
    expect(document.documentElement.lang).toBe('es')

    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])
    window.dispatchEvent(new Event('languagechange'))

    await expect.poll(() => document.documentElement.lang).toBe('en')
    expect(i18n.t('nav.year')).toBe('Year')
    stop()
  })

  it('deja de seguirlos al detenerlo', async () => {
    const i18n = createI18n('es')
    followDeviceLanguage(i18n)()

    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])
    window.dispatchEvent(new Event('languagechange'))
    await Promise.resolve()

    expect(i18n.language).toBe('es')
  })
})
