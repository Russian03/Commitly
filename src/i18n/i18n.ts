import type { i18n as I18n } from 'i18next'
import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import es from './es.json'
import type { Language } from './language'
import { resolveLanguage } from './language'

export function createI18n(language: Language): I18n {
  const instance = createInstance()
  // Los textos van dentro de la app, así que la inicialización es inmediata.
  void instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: 'en',
    resources: { es: { translation: es }, en: { translation: en } },
    initAsync: false,
    interpolation: { escapeValue: false }, // React ya escapa el texto.
  })
  return instance
}

/** Mantiene el idioma al día si cambia en el móvil. Devuelve cómo dejar de seguirlo. */
export function followDeviceLanguage(i18n: I18n): () => void {
  const markDocument = () => {
    document.documentElement.lang = i18n.language
  }
  const update = () => {
    void i18n.changeLanguage(resolveLanguage(navigator.languages)).then(markDocument)
  }

  markDocument()
  window.addEventListener('languagechange', update)
  return () => {
    window.removeEventListener('languagechange', update)
  }
}
