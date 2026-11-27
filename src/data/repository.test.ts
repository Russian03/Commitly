import { describe, expect, it } from 'vitest'
import { createEmptyData } from '../domain/appData'
import { encodeDocument } from './document'
import { createRepository, DATA_KEY } from './repository'
import type { KeyValueStorage } from './storage'
import { memoryStorage, SAMPLE } from './testing'

const BACKUP_1 = `${DATA_KEY}.corrupt.1`
const BACKUP_2 = `${DATA_KEY}.corrupt.2`
const NEWER = '{"schemaVersion":99}'

describe('load', () => {
  it('sin nada guardado empieza de cero', async () => {
    const repository = createRepository(memoryStorage())

    expect(await repository.load()).toEqual({ status: 'ready', data: createEmptyData() })
  })

  it('devuelve lo guardado', async () => {
    const storage = memoryStorage({ [DATA_KEY]: encodeDocument(SAMPLE) })

    expect(await createRepository(storage).load()).toEqual({ status: 'ready', data: SAMPLE })
  })

  it('copia los datos dañados sin tocar el original', async () => {
    const storage = memoryStorage({ [DATA_KEY]: 'roto' })

    const result = await createRepository(storage).load()

    expect(result).toEqual({ status: 'corrupt', backupKey: BACKUP_1 })
    expect(storage.entries.get(DATA_KEY)).toBe('roto')
    expect(storage.entries.get(BACKUP_1)).toBe('roto')
  })

  it('no repite la copia en cada arranque', async () => {
    const storage = memoryStorage({ [DATA_KEY]: 'roto' })

    await createRepository(storage).load()
    await createRepository(storage).load()

    expect([...storage.entries.keys()]).toEqual([DATA_KEY, BACKUP_1])
  })

  it('no pisa una copia anterior distinta', async () => {
    const storage = memoryStorage({ [DATA_KEY]: 'roto otra vez', [BACKUP_1]: 'roto' })

    const result = await createRepository(storage).load()

    expect(result).toEqual({ status: 'corrupt', backupKey: BACKUP_2 })
    expect(storage.entries.get(BACKUP_1)).toBe('roto')
  })

  it('avisa si los datos son de una versión más nueva', async () => {
    const storage = memoryStorage({ [DATA_KEY]: NEWER })

    expect(await createRepository(storage).load()).toEqual({ status: 'unsupported', version: 99 })
    expect(storage.entries.size).toBe(1)
  })

  it('propaga los fallos de lectura', async () => {
    const storage: KeyValueStorage = {
      ...memoryStorage(),
      get: () => Promise.reject(new Error('sin acceso')),
    }

    await expect(createRepository(storage).load()).rejects.toThrow('sin acceso')
  })
})

describe('save', () => {
  it('guarda los datos', async () => {
    const storage = memoryStorage()
    const repository = createRepository(storage)
    await repository.load()

    await repository.save(SAMPLE)

    expect(storage.entries.get(DATA_KEY)).toBe(encodeDocument(SAMPLE))
  })

  it('se niega antes de haber leído', async () => {
    const storage = memoryStorage({ [DATA_KEY]: encodeDocument(SAMPLE) })

    await expect(createRepository(storage).save(createEmptyData())).rejects.toThrow()
    expect(storage.entries.get(DATA_KEY)).toBe(encodeDocument(SAMPLE))
  })

  it.each([
    ['dañados', 'roto'],
    ['de una versión más nueva', NEWER],
  ])('nunca sobrescribe en silencio datos %s', async (_, raw) => {
    const storage = memoryStorage({ [DATA_KEY]: raw })
    const repository = createRepository(storage)
    await repository.load()

    await expect(repository.save(createEmptyData())).rejects.toThrow()
    expect(storage.entries.get(DATA_KEY)).toBe(raw)
  })

  it('sigue bloqueado si la copia de seguridad falla', async () => {
    const memory = memoryStorage({ [DATA_KEY]: 'roto' })
    const repository = createRepository({
      get: memory.get,
      set: () => Promise.reject(new Error('disco lleno')),
    })

    await expect(repository.load()).rejects.toThrow('disco lleno')
    await expect(repository.save(createEmptyData())).rejects.toThrow()
    await expect(repository.startOver()).rejects.toThrow()
  })

  it('se vuelve a bloquear si una relectura falla', async () => {
    const memory = memoryStorage()
    let fail = false
    const repository = createRepository({
      get: (key) => (fail ? Promise.reject(new Error('sin acceso')) : memory.get(key)),
      set: memory.set,
    })
    await repository.load()
    fail = true

    await expect(repository.load()).rejects.toThrow()
    await expect(repository.save(SAMPLE)).rejects.toThrow()
  })

  it('no guarda datos incoherentes', async () => {
    const storage = memoryStorage()
    const repository = createRepository(storage)
    await repository.load()

    await expect(repository.save({ ...SAMPLE, nextGoalNumber: 1 })).rejects.toThrow()
    expect(storage.entries.size).toBe(0)
  })

  it('escribe en el orden pedido aunque la primera tarde más', async () => {
    const memory = memoryStorage()
    const pending: (() => void)[] = []
    const repository = createRepository({
      get: memory.get,
      set: (key, value) =>
        new Promise((resolve) => {
          pending.push(() => {
            void memory.set(key, value).then(resolve)
          })
        }),
    })
    await repository.load()

    const first = repository.save(createEmptyData())
    const second = repository.save(SAMPLE)
    await expect.poll(() => pending.length).toBe(1)
    pending[0]?.()
    await first
    await expect.poll(() => pending.length).toBe(2)
    pending[1]?.()
    await second

    expect(memory.entries.get(DATA_KEY)).toBe(encodeDocument(SAMPLE))
  })

  it('un fallo de escritura se comunica y no frena las siguientes', async () => {
    const memory = memoryStorage()
    let failures = 1
    const repository = createRepository({
      get: memory.get,
      set: (key, value) => {
        if (failures > 0) {
          failures -= 1
          return Promise.reject(new Error('disco lleno'))
        }
        return memory.set(key, value)
      },
    })
    await repository.load()

    const first = repository.save(createEmptyData())
    const second = repository.save(SAMPLE)

    await expect(first).rejects.toThrow('disco lleno')
    await expect(second).resolves.toBeUndefined()
    expect(memory.entries.get(DATA_KEY)).toBe(encodeDocument(SAMPLE))
  })

  it('una relectura espera a las escrituras pendientes', async () => {
    const repository = createRepository(memoryStorage())
    await repository.load()

    void repository.save(SAMPLE)

    expect(await repository.load()).toEqual({ status: 'ready', data: SAMPLE })
  })
})

describe('startOver', () => {
  it('empieza de cero conservando la copia de los datos dañados', async () => {
    const storage = memoryStorage({ [DATA_KEY]: 'roto' })
    const repository = createRepository(storage)
    await repository.load()

    expect(await repository.startOver()).toEqual(createEmptyData())

    expect(storage.entries.get(BACKUP_1)).toBe('roto')
    expect(storage.entries.get(DATA_KEY)).toBe(encodeDocument(createEmptyData()))
    await expect(repository.save(SAMPLE)).resolves.toBeUndefined()
  })

  it.each([
    ['están bien', encodeDocument(SAMPLE)],
    ['son de una versión más nueva', NEWER],
  ])('se niega si los datos %s', async (_, raw) => {
    const storage = memoryStorage({ [DATA_KEY]: raw })
    const repository = createRepository(storage)
    await repository.load()

    await expect(repository.startOver()).rejects.toThrow()
    expect(storage.entries.get(DATA_KEY)).toBe(raw)
  })

  it('si no se puede escribir, sigue permitiendo reintentarlo', async () => {
    const memory = memoryStorage({ [DATA_KEY]: 'roto', [BACKUP_1]: 'roto' })
    let fail = true
    const repository = createRepository({
      get: memory.get,
      set: (key, value) =>
        fail ? Promise.reject(new Error('disco lleno')) : memory.set(key, value),
    })
    await repository.load()

    await expect(repository.startOver()).rejects.toThrow('disco lleno')
    fail = false

    await expect(repository.startOver()).resolves.toEqual(createEmptyData())
  })
})
