# Commitly

🇬🇧 English · [🇪🇸 Español](README.es.md)

**Every day you keep your goals, your year gets greener.**

Commitly is a daily goal tracker. Choose your goals, check them off, and watch each
day of the year fill with a stronger shade of green.

> **Status:** in development. There is no downloadable version yet.

## Planned for the first version

- **Tasks:** daily goals on the weekdays you choose, from presets or your own.
- **Today:** your award for the day, streak, level and points.
- **Year:** every day of the year at a glance.
- **Settings:** language (English and Spanish) and your data.

Android first, distributed as an APK through GitHub Releases.

## Development

Requirements: Node 24, pnpm (the version in `package.json`), JDK 21 and Android SDK 36.

```bash
pnpm install       # dependencies and git hooks
pnpm dev           # app in the browser
pnpm check         # format, lint, types, tests and build
pnpm test:e2e      # end-to-end tests (first: pnpm exec playwright install chromium)
pnpm android:apk   # debug APK in android/app/build/outputs/apk/debug/
```

The app requests no Android permissions, not even Internet access.

## License

© 2026 Russian03. All rights reserved. See [LICENSE](LICENSE).
