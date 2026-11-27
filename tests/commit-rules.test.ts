// @vitest-environment node
import lint from '@commitlint/lint'
import load from '@commitlint/load'
import { beforeAll, describe, expect, it } from 'vitest'

let check: (message: string) => Promise<boolean>

beforeAll(async () => {
  const { rules, plugins, defaultIgnores } = await load()
  check = async (message) =>
    (await lint(message, rules, { plugins, defaultIgnores: defaultIgnores ?? true })).valid
})

describe('reglas de los mensajes de commit', () => {
  it.each([
    'feat: añadir la rejilla anual',
    'fix(hoy): corregir la racha al cambiar de día',
    'chore: estructura inicial del repositorio',
    'docs: explicar cómo se calculan los puntos\n\nLas ilustraciones generadas con SVG siguen igual.',
  ])('admite «%s»', async (message) => {
    expect(await check(message)).toBe(true)
  })

  it.each([
    'feat: algo\n\nCo-Authored-By: Alguien <alguien@example.com>',
    'feat: algo\n\nco-authored-by: Alguien <alguien@example.com>',
    'feat: algo\n\nAssisted-by: una herramienta',
    'feat: algo\n\n🤖 Generated with una herramienta',
    'arreglos varios',
    "Merge branch 'main' into feat/algo",
  ])('rechaza «%s»', async (message) => {
    expect(await check(message)).toBe(false)
  })
})
