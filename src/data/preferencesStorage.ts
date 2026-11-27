import { Preferences } from '@capacitor/preferences'
import type { KeyValueStorage } from './storage'

/** Preferencias privadas de la app en el dispositivo. */
export const preferencesStorage: KeyValueStorage = {
  get: async (key) => (await Preferences.get({ key })).value,
  set: (key, value) => Preferences.set({ key, value }),
}
