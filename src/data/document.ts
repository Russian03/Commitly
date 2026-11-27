/** Paso entre el texto guardado y los datos de la app. */
import type { AppData } from '../domain/appData'
import { documentSchema, headerSchema, SCHEMA_VERSION } from './schema'

export type Migration = (document: Record<string, unknown>) => Record<string, unknown>

/** Cada paso se indexa por la versión de la que parte. */
export type MigrationSteps = Readonly<Partial<Record<number, Migration>>>

// Todavía no hay versiones anteriores a la 1.
const MIGRATIONS: MigrationSteps = {}

export type DecodedDocument =
  | { readonly status: 'ok'; readonly data: AppData }
  | { readonly status: 'corrupt' }
  | { readonly status: 'unsupported'; readonly version: number }

/** Lleva un documento de la versión `from` a la `to`. Devuelve `null` si no se puede. */
export function migrate(
  document: Record<string, unknown>,
  from: number,
  to: number,
  steps: MigrationSteps,
): Record<string, unknown> | null {
  let current = document
  for (let version = from; version < to; version += 1) {
    const step = steps[version]
    if (!step) return null
    try {
      current = { ...step(current), schemaVersion: version + 1 }
    } catch {
      // Quien llama lo trata como dato dañado: se copia y se avisa.
      return null
    }
  }
  return current
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

export function decodeDocument(raw: string): DecodedDocument {
  const header = headerSchema.safeParse(parseJson(raw))
  if (!header.success) return { status: 'corrupt' }

  const version = header.data.schemaVersion
  if (version > SCHEMA_VERSION) return { status: 'unsupported', version }

  const upToDate = migrate(header.data, version, SCHEMA_VERSION, MIGRATIONS)
  const parsed = documentSchema.safeParse(upToDate)
  if (!parsed.success) return { status: 'corrupt' }

  const { goals, days, nextGoalNumber } = parsed.data
  return { status: 'ok', data: { goals, days, nextGoalNumber } }
}

/** Lanza un error si los datos no cumplen el esquema: así nunca se escribe algo ilegible. */
export function encodeDocument(data: AppData): string {
  return JSON.stringify(documentSchema.parse({ schemaVersion: SCHEMA_VERSION, ...data }))
}
