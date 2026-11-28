import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { expectAccessible } from './accessibility'
import { watchProblems } from './watch'

test.use({ locale: 'es-ES' })

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const card = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name} `) })
const days = (page: Page) => page.getByRole('group', { name: /^Días de/ }).getByRole('button')

async function addPreset(page: Page, name: string) {
  await button(page, 'Añadir nueva meta').click()
  await card(page, name).click()
  await button(page, 'Añadir').click()
}

/** Cuánto sobra por los lados y por abajo; con la cuadrícula entera a la vista no sobra nada. */
const overflow = (page: Page) =>
  page.evaluate(() => {
    const main = document.querySelector('main')
    if (!main) return null
    return {
      x: main.scrollWidth - main.clientWidth,
      y: main.scrollHeight - main.clientHeight,
    }
  })

/** Los cuadros se salen de la pantalla o se pisan con lo que hay debajo. */
const misplacedDays = (page: Page) =>
  page.evaluate(() => {
    const main = document.querySelector('main')?.getBoundingClientRect()
    const legend = document.querySelector('main [data-strip]')?.previousElementSibling
    if (!main || !legend) return -1
    const floor = legend.getBoundingClientRect().top
    return [...document.querySelectorAll('main [role="group"] button')].filter((cell) => {
      const box = cell.getBoundingClientRect()
      return box.width < 6 || box.left < main.left || box.right > main.right || box.bottom > floor
    }).length
  })

for (const [width, height] of [
  [393, 727],
  [320, 568],
  [412, 915],
] as const) {
  test(`el año entero cabe sin desplazar en ${width} × ${height}`, async ({ page, baseURL }) => {
    const problems = await watchProblems(page, baseURL)
    await page.setViewportSize({ width, height })
    await page.clock.install({ time: new Date(2028, 10, 27, 12) })
    await page.goto('/')
    // Android informa así del hueco que ocupan las barras del sistema.
    await page.evaluate(() => {
      const { style } = document.documentElement
      style.setProperty('--safe-area-inset-top', '36px')
      style.setProperty('--safe-area-inset-bottom', '16px')
    })
    for (const name of ['Leer 30 min', 'Estudiar 1 h']) await addPreset(page, name)
    await button(page, 'Año').click()

    await expect(days(page)).toHaveCount(366)
    await expect.poll(() => overflow(page)).toEqual({ x: 0, y: 0 })
    expect(await misplacedDays(page)).toBe(0)
    // Elegir un día no mueve ni encoge la cuadrícula.
    const first = await days(page).first().boundingBox()
    await page.getByRole('button', { name: /^30 de septiembre: / }).click()
    await expect(page.getByRole('heading', { name: '30 de septiembre' })).toBeVisible()
    expect(await days(page).first().boundingBox()).toEqual(first)
    expect(await overflow(page)).toEqual({ x: 0, y: 0 })
    await expectAccessible(page)
    expect(problems).toEqual([])
  })
}

test('al cumplir las metas el día se pinta y al tocarlo se cuenta cómo fue', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 10, 27, 12) })
  await page.goto('/')
  await addPreset(page, 'Leer 30 min')
  await card(page, 'Leer 30 min').click()
  await button(page, 'Año').click()

  const today = page.getByRole('button', { name: /^27 de noviembre: / })
  await expect(today).toHaveAttribute('data-level', '1')
  await expect(today).toHaveCSS('background-color', 'rgb(191, 229, 207)')
  await expect(page.getByText('Con 1 meta, el máximo de hoy es el verde 1 de 4.')).toBeVisible()

  await page.getByRole('button', { name: /^3 de marzo: / }).click()

  await expect(page.getByRole('heading', { level: 2, name: '3 de marzo' })).toBeVisible()
  await expect(page.getByText('Sin registro')).toBeVisible()
  await expectAccessible(page)

  await page.getByRole('button', { name: /^3 de marzo: / }).click()

  await expect(page.getByRole('heading', { level: 2, name: 'Elige un día' })).toBeVisible()
  await expect(page.locator('main button[aria-pressed="true"]')).toHaveCount(0)
  await expectAccessible(page)
})

test('con historial se puede volver al año anterior', async ({ page, baseURL }) => {
  const problems = await watchProblems(page, baseURL)
  await page.clock.install({ time: new Date(2025, 11, 31, 12) })
  await page.goto('/')
  await addPreset(page, 'Leer 30 min')
  await card(page, 'Leer 30 min').click()
  await page.clock.setSystemTime(new Date(2026, 0, 2, 12))
  await page.reload()
  await button(page, 'Año').click()

  await button(page, 'Año anterior').click()

  await expect(page.getByRole('heading', { level: 1, name: 'Año 2025' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^31 de diciembre: / })).toHaveAttribute(
    'data-level',
    '1',
  )
  await expect.poll(() => overflow(page)).toEqual({ x: 0, y: 0 })
  await expectAccessible(page)
  expect(problems).toEqual([])
})
