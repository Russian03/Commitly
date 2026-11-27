import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { App } from '../App'
import { createRepository } from '../data/repository'
import type { MemoryStorage } from '../data/testing'
import { memoryStorage } from '../data/testing'
import { createI18n } from '../i18n/i18n'
import type { Language } from '../i18n/language'
import { createAppStore } from '../state/appStore'
import { AppStoreContext } from '../state/context'

export function renderIn(language: Language, ui: ReactNode) {
  return render(<I18nextProvider i18n={createI18n(language)}>{ui}</I18nextProvider>)
}

interface Options {
  readonly language?: Language
  readonly storage?: MemoryStorage
  readonly now?: () => Date
}

/** La app completa, ya cargada, con almacenamiento en memoria. Viernes 27 de noviembre. */
export async function renderApp(options: Options = {}) {
  const {
    language = 'es',
    storage = memoryStorage(),
    now = () => new Date(2026, 10, 27, 12),
  } = options
  const store = createAppStore(createRepository(storage), now)
  await store.getState().load()
  const view = renderIn(
    language,
    <AppStoreContext value={store}>
      <App />
    </AppStoreContext>,
  )
  return { ...view, store, storage }
}
