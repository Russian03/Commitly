import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { expectAccessible } from './accessibility'
import { watchProblems } from './watch'

test.use({ locale: 'es-ES', contextOptions: { reducedMotion: 'reduce' } })

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const title = (page: Page) => page.getByRole('heading', { level: 1 })
/** Una tarjeta se llama por su título seguido del dato. */
const card = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name} `) })

async function addPreset(page: Page, name: string) {
  await button(page, 'Añadir nueva meta').click()
  await card(page, name).click()
  await button(page, 'Añadir').click()
}

const expectNoSidewaysScroll = async (page: Page) => {
  const overflow = await page.evaluate(() => {
    const main = document.querySelector('main')
    return main ? main.scrollWidth - main.clientWidth : -1
  })
  expect(overflow).toBe(0)
}

test('añadir, marcar y conservar tras volver a abrir', async ({ page, baseURL }) => {
  const problems = await watchProblems(page, baseURL)
  await page.goto('/')

  await addPreset(page, 'Leer 30 min')
  await addPreset(page, 'Beber 2 L de agua')
  await card(page, 'Leer 30 min').click()
  await expect(card(page, 'Leer 30 min')).toHaveAttribute('aria-pressed', 'true')
  await expectAccessible(page)
  await expectNoSidewaysScroll(page)

  await page.reload()

  await expect(card(page, 'Leer 30 min')).toHaveAttribute('aria-pressed', 'true')
  await expect(card(page, 'Beber 2 L de agua')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('[data-title]')).toHaveText([
    'Beber 2 L de agua',
    'Leer 30 min',
    'Añadir nueva meta',
  ])
  expect(problems).toEqual([])
})

test('el catálogo y los formularios son accesibles', async ({ page, baseURL }) => {
  const problems = await watchProblems(page, baseURL)
  await page.goto('/')

  await button(page, 'Añadir nueva meta').click()
  await expect(title(page)).toHaveText('Añadir meta')
  await expect(page.getByRole('navigation')).toBeHidden()
  await expectAccessible(page)
  await expectNoSidewaysScroll(page)

  await card(page, 'Crear la mía').click()
  await button(page, 'Añadir').click()
  await expect(page.getByRole('alert')).toHaveText('Escribe un nombre.')
  await expectAccessible(page)
  await expectNoSidewaysScroll(page)

  await page.getByRole('textbox', { name: 'Nombre' }).fill('Tocar la guitarra')
  await page.keyboard.press('Enter')
  await button(page, 'Editar').click()
  await expect(title(page)).toHaveText('Editar metas')
  await expectAccessible(page)
  await expectNoSidewaysScroll(page)

  await card(page, 'Tocar la guitarra').click()
  await button(page, 'Quitar meta').click()
  await expectAccessible(page)

  await button(page, 'Quitar').click()
  await expect(page.getByText('Aún no tienes metas.')).toBeVisible()
  expect(problems).toEqual([])
})

test('un nombre largo sin espacios no descuadra la pantalla', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/')

  await button(page, 'Añadir nueva meta').click()
  await card(page, 'Crear la mía').click()
  await expectNoSidewaysScroll(page)
  await page.getByRole('textbox', { name: 'Nombre' }).fill('W'.repeat(40))
  await button(page, 'Añadir').click()

  await expect(title(page)).toHaveAccessibleName('Tu día perfecto!')
  await expectNoSidewaysScroll(page)
})

test('al desplazarse, nada pasa por debajo de la barra de estado', async ({ page }) => {
  await page.goto('/')
  // Android informa así del margen que ocupa la barra de estado.
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--safe-area-inset-top', '40px')
  })
  for (const name of ['Leer 30 min', 'Estudiar 1 h', 'Beber 2 L de agua']) {
    await addPreset(page, name)
  }

  const scroller = page.locator('main')
  await scroller.evaluate((main) => {
    main.scrollTo(0, main.scrollHeight)
  })

  expect((await scroller.boundingBox())?.y).toBeGreaterThanOrEqual(40)
})

test('los días se cambian entrando en la meta y guardando', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/')
  await addPreset(page, 'Leer 30 min')
  await button(page, 'Editar').click()
  await expectNoSidewaysScroll(page)

  await card(page, 'Leer 30 min').click()
  await button(page, 'Lunes').click()
  await button(page, 'Guardar').click()
  await expect(title(page)).toHaveText('Editar metas')
  await page.reload()
  await button(page, 'Editar').click()

  await expect(card(page, 'Leer 30 min')).toHaveAccessibleName(
    'Leer 30 min Mar, mié, jue, vie, sáb, dom',
  )
})

test('Escape cierra las páginas de una en una', async ({ page }) => {
  await page.goto('/')
  await button(page, 'Añadir nueva meta').click()
  await card(page, 'Meditar 10 min').click()

  await page.keyboard.press('Escape')
  await expect(title(page)).toHaveText('Añadir meta')
  await page.keyboard.press('Escape')
  await expect(title(page)).toHaveAccessibleName('Tu día perfecto!')
})

test('a medianoche la lista pasa al día nuevo sin tocar nada', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 10, 27, 23, 58) })
  await page.goto('/')
  await addPreset(page, 'Leer 30 min')
  await card(page, 'Leer 30 min').click()
  await expect(card(page, 'Leer 30 min')).toHaveAttribute('aria-pressed', 'true')

  await page.clock.runFor('03:00')

  await expect(card(page, 'Leer 30 min')).toHaveAttribute('aria-pressed', 'false')
})
