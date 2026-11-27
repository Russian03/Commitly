import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { createI18n } from '../i18n/i18n'
import type { Language } from '../i18n/language'

export function renderIn(language: Language, ui: ReactNode) {
  return render(<I18nextProvider i18n={createI18n(language)}>{ui}</I18nextProvider>)
}
