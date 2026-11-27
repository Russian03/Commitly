import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { AppState, AppStore } from './appStore'

export const AppStoreContext = createContext<AppStore | null>(null)

export function useApp<T>(selector: (state: AppState) => T): T {
  const store = useContext(AppStoreContext)
  if (!store) throw new Error('Falta AppStoreContext por encima de este componente')
  return useStore(store, selector)
}
