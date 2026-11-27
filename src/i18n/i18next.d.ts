import 'i18next'
import type es from './es.json'

// Una clave de texto mal escrita es un error de compilación.
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof es }
  }
}
