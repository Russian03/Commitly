/** Avisos y acciones del sistema. En el navegador no hay botón «atrás» ni se puede minimizar. */
import { App } from '@capacitor/app'
import type { PluginListenerHandle } from '@capacitor/core'

function unsubscribe(handle: Promise<PluginListenerHandle>): () => void {
  return () => {
    void handle.then((listener) => listener.remove())
  }
}

/** El botón o gesto «atrás» de Android. Con un oyente, la app ya no se cierra sola. */
export function onBackButton(listener: () => void): () => void {
  return unsubscribe(App.addListener('backButton', listener))
}

export function onResume(listener: () => void): () => void {
  return unsubscribe(App.addListener('resume', listener))
}

export function minimizeApp(): void {
  // Donde no está disponible no hay nada que hacer ni que contar a la persona.
  App.minimizeApp().catch(() => undefined)
}
