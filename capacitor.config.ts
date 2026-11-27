import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.github.russian03.commitly',
  appName: 'Commitly',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  // Los registros del puente nativo solo salen en las compilaciones de depuración.
  loggingBehavior: 'debug',
  android: {
    // La misma versión que el destino de compilación de vite.config.ts.
    minWebViewVersion: 89,
  },
  plugins: {
    // Iconos oscuros sobre el fondo blanco y márgenes seguros como variables CSS.
    SystemBars: { style: 'LIGHT', initialViewportFitValueHint: 'cover' },
  },
}

export default config
