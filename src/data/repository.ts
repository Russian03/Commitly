import type { AppData } from '../domain/appData'
import { createEmptyData } from '../domain/appData'
import { decodeDocument, encodeDocument } from './document'
import type { KeyValueStorage } from './storage'

export const DATA_KEY = 'commitly.data'

export type LoadResult =
  | { readonly status: 'ready'; readonly data: AppData }
  /** Los datos no se pueden leer. Hay una copia en `backupKey` y el original sigue intacto. */
  | { readonly status: 'corrupt'; readonly backupKey: string }
  /** Los guardó una versión más nueva de la app. */
  | { readonly status: 'unsupported'; readonly version: number }

export interface Repository {
  load(): Promise<LoadResult>
  /** Solo se puede guardar después de una lectura correcta. */
  save(data: AppData): Promise<void>
  /** Tras avisar de datos dañados, y solo si la persona lo pide, empieza de cero. */
  startOver(): Promise<AppData>
}

export function createRepository(storage: KeyValueStorage): Repository {
  let mode: 'locked' | 'writable' | 'corrupt' = 'locked'
  // Las escrituras van de una en una: la última pedida es la que queda.
  let queue: Promise<void> = Promise.resolve()

  const write = (value: string): Promise<void> => {
    const result = queue.then(() => storage.set(DATA_KEY, value))
    // El fallo lo recibe quien pidió esta escritura; las siguientes continúan.
    queue = result.catch(() => undefined)
    return result
  }

  /** Reutiliza la copia si ya existe y nunca pisa una distinta. */
  const backUp = async (raw: string): Promise<string> => {
    for (let slot = 1; ; slot += 1) {
      const key = `${DATA_KEY}.corrupt.${slot}`
      const existing = await storage.get(key)
      if (existing === null) await storage.set(key, raw)
      if (existing === null || existing === raw) return key
    }
  }

  return {
    async load() {
      mode = 'locked'
      await queue
      const raw = await storage.get(DATA_KEY)
      if (raw === null) {
        mode = 'writable'
        return { status: 'ready', data: createEmptyData() }
      }

      const decoded = decodeDocument(raw)
      if (decoded.status === 'unsupported') return decoded
      if (decoded.status === 'ok') {
        mode = 'writable'
        return { status: 'ready', data: decoded.data }
      }

      const backupKey = await backUp(raw)
      mode = 'corrupt'
      return { status: 'corrupt', backupKey }
    },

    async save(data) {
      if (mode !== 'writable') {
        throw new Error('No se puede guardar sin haber leído antes los datos sin errores')
      }
      await write(encodeDocument(data))
    },

    async startOver() {
      if (mode !== 'corrupt') {
        throw new Error('Solo se puede empezar de cero cuando los datos están dañados')
      }
      const data = createEmptyData()
      await write(encodeDocument(data))
      mode = 'writable'
      return data
    },
  }
}
