/** Mayúscula inicial según las reglas del idioma: las fechas llegan en minúscula. */
export function capitalize(text: string, language: string): string {
  return text.charAt(0).toLocaleUpperCase(language) + text.slice(1)
}
