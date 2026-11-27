import { beforeEach, describe, expect, it, vi } from 'vitest'
import { minimizeApp, onBackButton, onResume } from './lifecycle'

const plugin = vi.hoisted(() => ({
  listeners: new Map<string, () => void>(),
  remove: vi.fn(() => Promise.resolve()),
  minimize: vi.fn(() => Promise.resolve()),
}))

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (event: string, listener: () => void) => {
      plugin.listeners.set(event, listener)
      return Promise.resolve({ remove: plugin.remove })
    },
    minimizeApp: plugin.minimize,
  },
}))

beforeEach(() => {
  plugin.listeners.clear()
  plugin.remove.mockClear()
  plugin.minimize.mockClear()
})

describe.each([
  ['backButton', onBackButton],
  ['resume', onResume],
])('aviso de %s', (event, subscribe) => {
  it('llama al oyente', () => {
    const listener = vi.fn()
    subscribe(listener)

    plugin.listeners.get(event)?.()

    expect(listener).toHaveBeenCalledOnce()
  })

  it('al cancelar quita el oyente', async () => {
    subscribe(vi.fn())()

    await vi.waitFor(() => {
      expect(plugin.remove).toHaveBeenCalledOnce()
    })
  })
})

describe('minimizeApp', () => {
  it('manda la app a segundo plano', () => {
    minimizeApp()

    expect(plugin.minimize).toHaveBeenCalledOnce()
  })

  it('no falla donde no se puede, como en el navegador', async () => {
    plugin.minimize.mockRejectedValueOnce(new Error('unimplemented'))

    expect(() => {
      minimizeApp()
    }).not.toThrow()
    await Promise.resolve()
  })
})
