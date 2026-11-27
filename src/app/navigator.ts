import { createContext, useContext } from 'react'
import type { Page } from './navigation'

export interface Navigator {
  readonly open: (page: Page) => void
  readonly back: () => void
  /** Cierra todas las páginas abiertas. */
  readonly close: () => void
  /** `true` hasta el primer cambio de pantalla: sirve para las animaciones de entrada. */
  readonly intro: boolean
}

export const NavigatorContext = createContext<Navigator | null>(null)

export function useNavigator(): Navigator {
  const navigator = useContext(NavigatorContext)
  if (!navigator) throw new Error('Falta NavigatorContext por encima de este componente')
  return navigator
}
