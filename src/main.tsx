import '@fontsource-variable/inter-tight/wght.css'
import '@fontsource-variable/inter-tight/wght-italic.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { App } from './App'
import { preferencesStorage } from './data/preferencesStorage'
import { createRepository } from './data/repository'
import { createI18n, followDeviceLanguage } from './i18n/i18n'
import { resolveLanguage } from './i18n/language'
import { createAppStore } from './state/appStore'
import { AppStoreContext } from './state/context'
import './ui/design/tokens.css'
import './ui/design/base.css'

const container = document.getElementById('root')
if (!container) throw new Error('Falta el elemento #root en index.html')

const i18n = createI18n(resolveLanguage(navigator.languages))
followDeviceLanguage(i18n)

const store = createAppStore(createRepository(preferencesStorage))
void store.getState().load()

createRoot(container).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <AppStoreContext value={store}>
        <App />
      </AppStoreContext>
    </I18nextProvider>
  </StrictMode>,
)
