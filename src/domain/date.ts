/** Un día del calendario local en formato `AAAA-MM-DD`. Se ordena como texto. */
export type DayKey = `${number}-${number}-${number}`

/** Día de la semana según ISO 8601: 1 es lunes y 7 es domingo. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7]

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MIN_YEAR = 1000
const MAX_YEAR = 9999
const MS_PER_DAY = 86_400_000

const pad = (value: number): string => String(value).padStart(2, '0')

function fromParts(year: number, month: number, day: number): DayKey {
  // La comparación en positivo también descarta NaN (fechas no válidas).
  if (!(year >= MIN_YEAR && year <= MAX_YEAR)) {
    throw new RangeError('Fecha fuera del calendario admitido')
  }
  return `${year}-${pad(month)}-${pad(day)}` as DayKey
}

/** Año, mes empezando en 0 y día, en el orden que piden `Date` y `Date.UTC`. */
function toParts(day: DayKey): [number, number, number] {
  const [year = NaN, month = NaN, date = NaN] = day.split('-').map(Number)
  return [year, month - 1, date]
}

// Las cuentas entre días se hacen en UTC, donde todos los días duran 24 horas.
function toUtcMillis(day: DayKey): number {
  return Date.UTC(...toParts(day))
}

function fromUtcMillis(millis: number): DayKey {
  const date = new Date(millis)
  return fromParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

/** El día en el que cae un instante según la zona horaria del dispositivo. */
export function toDayKey(date: Date): DayKey {
  return fromParts(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

/** El mediodía local de ese día, para darle formato: ningún cambio de hora lo mueve de fecha. */
export function toLocalDate(day: DayKey): Date {
  return new Date(...toParts(day), 12)
}

/** Valida un texto externo: devuelve `null` si no es un día que exista. */
export function parseDayKey(value: string): DayKey | null {
  if (!DAY_KEY_PATTERN.test(value)) return null
  const day = value as DayKey
  if (Number(value.slice(0, 4)) < MIN_YEAR) return null
  // Un día inexistente, como el 30 de febrero, se desborda al mes siguiente. No se usa
  // `fromUtcMillis`: aquí un desbordamiento más allá del último año no debe lanzar un error.
  return new Date(toUtcMillis(day)).toISOString().startsWith(value) ? day : null
}

export function addDays(day: DayKey, amount: number): DayKey {
  return fromUtcMillis(toUtcMillis(day) + amount * MS_PER_DAY)
}

export function daysBetween(from: DayKey, to: DayKey): number {
  return (toUtcMillis(to) - toUtcMillis(from)) / MS_PER_DAY
}

export function weekdayOf(day: DayKey): Weekday {
  const sundayFirst = new Date(toUtcMillis(day)).getUTCDay()
  return (((sundayFirst + 6) % 7) + 1) as Weekday
}

export function yearOf(day: DayKey): number {
  return Number(day.slice(0, 4))
}

export function daysOfYear(year: number): DayKey[] {
  const first = fromParts(year, 1, 1)
  const length = daysBetween(first, fromParts(year, 12, 31)) + 1
  return Array.from({ length }, (_, index) => addDays(first, index))
}
