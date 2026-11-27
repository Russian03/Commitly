import '@fontsource-variable/inter-tight/wght.css'
import '@fontsource-variable/inter-tight/wght-italic.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { App } from './App'
import { createI18n, followDeviceLanguage } from './i18n/i18n'
import { resolveLanguage } from './i18n/language'
import './ui/design/tokens.css'
import './ui/design/base.css'

const container = document.getElementById('root')
if (!container) throw new Error('Falta el elemento #root en index.html')

const i18n = createI18n(resolveLanguage(navigator.languages))
followDeviceLanguage(i18n)

createRoot(container).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
)
