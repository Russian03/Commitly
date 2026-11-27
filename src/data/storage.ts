/** Almacén de textos por clave. La app usa las preferencias nativas; las pruebas, memoria. */
export interface KeyValueStorage {
  readonly get: (key: string) => Promise<string | null>
  readonly set: (key: string, value: string) => Promise<void>
}
