# Commitly

[🇬🇧 English](README.md) · 🇪🇸 Español

**Cada día que cumples tus metas, tu año se vuelve más verde.**

Commitly es una app de seguimiento diario. Elige tus metas, márcalas y mira cómo cada
día del año se pinta de un verde más intenso.

> **Estado:** en desarrollo. Todavía no hay versión descargable.

## Previsto para la primera versión

- **Tareas:** metas diarias en los días que elijas, de ejemplo o propias.
- **Hoy:** tu galardón del día, racha, nivel y puntos.
- **Año:** todos los días del año de un vistazo.
- **Ajustes:** idioma (español e inglés) y tus datos.

Primero Android, distribuida como APK en las Releases de GitHub.

## Desarrollo

Requisitos: Node 24, pnpm (la versión de `package.json`), JDK 21 y Android SDK 36.

```bash
pnpm install       # dependencias y hooks de git
pnpm dev           # la app en el navegador
pnpm check         # formato, lint, tipos, tests y compilación
pnpm test:e2e      # pruebas de extremo a extremo (antes: pnpm exec playwright install chromium)
pnpm android:apk   # APK de depuración en android/app/build/outputs/apk/debug/
```

La app no pide ningún permiso de Android, ni siquiera acceso a Internet.

## Licencia

© 2026 Russian03. Todos los derechos reservados. Ver [LICENSE](LICENSE).
