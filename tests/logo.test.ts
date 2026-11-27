// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const paths = (xml: string, attribute: string) =>
  [...xml.matchAll(new RegExp(`${attribute}="(M[^"]+)"`, 'g'))].map((match) => match[1])

const [logo] = paths(read('design/logo.svg'), ' d')
const res = 'android/app/src/main/res'

describe('logo', () => {
  it('tiene un único trazo de origen', () => {
    expect(paths(read('design/logo.svg'), ' d')).toHaveLength(1)
  })

  it.each([
    `${res}/drawable/ic_launcher_foreground.xml`,
    `${res}/drawable/ic_splash.xml`,
    `${res}/mipmap-anydpi/ic_launcher.xml`,
  ])('%s dibuja el mismo logo', (file) => {
    expect(paths(read(file), 'android:pathData')).toContain(logo)
  })

  it('la medalla lleva el mismo logo', () => {
    expect(paths(read('src/features/today/Medal.tsx'), ' d')).toContain(logo)
  })
})
