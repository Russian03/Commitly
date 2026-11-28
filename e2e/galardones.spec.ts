import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { expectAccessible } from './accessibility'
import { watchProblems } from './watch'

test.use({ locale: 'es-ES' })

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
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

test('al completar el día se celebra y suben las rachas', async ({ page, baseURL }) => {
  const problems = await watchProblems(page, baseURL)
  await page.goto('/')
  await addPreset(page, 'Leer 30 min')
  await addPreset(page, 'Beber 2 L de agua')
  await card(page, 'Leer 30 min').click()
  await button(page, 'Hoy').click()
  await expect(page.getByText('1 de 2 metas · +10 puntos mañana a las 8:00')).toBeVisible()
  await expect(page.getByTestId('celebration')).toHaveCount(0)
  await expectAccessible(page)

  await button(page, 'Tareas').click()
  await card(page, 'Beber 2 L de agua').click()
  await button(page, 'Hoy').click()

  await expect(page.getByTestId('celebration')).toHaveCount(1)
  await expect(page.getByTestId('celebration')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Día perfecto', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '1 día perfecto seguido' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(2)
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  await expectAccessible(page)

  const strip = page.getByRole('button', { name: /^Leer 30 min / })
  await strip.click()
  await expect(strip).toHaveAttribute('aria-expanded', 'true')
  const unlockable = page.locator('[data-strip]', { has: strip }).getByText('10 días seguidos')
  await expect(unlockable).toBeVisible()
  await page.getByRole('button', { name: /^10 días perfectos / }).click()
  await expect(page.getByText('365 días perfectos')).toBeVisible()
  await expectAccessible(page)
  await expectNoSidewaysScroll(page)
  expect(problems).toEqual([])
})

test('los puntos se suman a las 8:00 del día siguiente', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 10, 27, 23, 0) })
  await page.goto('/')
  await addPreset(page, 'Leer 30 min')
  await card(page, 'Leer 30 min').click()
  await button(page, 'Hoy').click()

  await page.clock.fastForward('08:59:50')
  await expect(page.getByText('0 puntos · +15 de ayer a las 8:00')).toBeVisible()

  await page.clock.fastForward('00:15')
  await expect(page.getByText('15 puntos', { exact: true })).toBeVisible()
})

test('no hay celebración animada si el móvil pide reducir el movimiento', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await addPreset(page, 'Leer 30 min')
  await card(page, 'Leer 30 min').click()

  await button(page, 'Hoy').click()

  await expect(page.getByRole('heading', { name: 'Día perfecto', exact: true })).toBeVisible()
  await expect(page.getByTestId('celebration')).toHaveCount(0)
})

test('cabe en un móvil estrecho en los dos estados', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/')
  await button(page, 'Hoy').click()
  await expect(page.getByRole('heading', { name: 'Sin metas' })).toBeVisible()
  await expectNoSidewaysScroll(page)
  await expectAccessible(page)

  await button(page, 'Tareas').click()
  for (const name of ['Leer 30 min', 'Estudiar 1 h', 'Meditar 10 min']) await addPreset(page, name)
  await button(page, 'Hoy').click()

  await expect(page.getByRole('heading', { name: 'Por empezar' })).toBeVisible()
  await expectNoSidewaysScroll(page)
  await expectAccessible(page)
})
