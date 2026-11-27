export const LANGUAGES = ['es', 'en'] as const

export type Language = (typeof LANGUAGES)[number]

const FALLBACK: Language = 'en'

/** El primer idioma admitido de la lista del móvil, que va ordenada por preferencia. */
export function resolveLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0]
    const match = LANGUAGES.find((language) => language === base)
    if (match) return match
  }
  return FALLBACK
}
