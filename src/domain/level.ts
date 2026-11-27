/** Intensidad del verde de un día: 0 es sin cumplir y 4 el más fuerte. */
export type ColorLevel = 0 | 1 | 2 | 3 | 4

/** El color máximo al que puede aspirar un día según cuántas metas tiene. */
export function colorCeiling(total: number): ColorLevel {
  if (total >= 6) return 4
  if (total >= 5) return 3
  if (total >= 3) return 2
  return total >= 1 ? 1 : 0
}

/** Porcentaje cumplido aplicado al techo del día. Con algo hecho, al menos nivel 1. */
export function colorLevel(done: number, total: number): ColorLevel {
  if (done <= 0 || total <= 0) return 0
  const proportional = Math.floor((done * colorCeiling(total)) / total)
  return Math.max(1, proportional) as ColorLevel
}
