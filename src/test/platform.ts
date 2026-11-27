/** Sustituto de los avisos del sistema para las pruebas de la app. */
import { vi } from 'vitest'

export const system = {
  pressBack: (): void => undefined,
  minimize: vi.fn(),
}

export const lifecycleMock = {
  onBackButton: (listener: () => void) => {
    system.pressBack = listener
    return () => {
      system.pressBack = () => undefined
    }
  },
  onResume: () => () => undefined,
  minimizeApp: () => {
    system.minimize()
  },
}
