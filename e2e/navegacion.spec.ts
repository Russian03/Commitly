import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { watchProblems } from './watch'

test.use({ locale: 'es-ES' })

const SECTIONS = [
  { name: 'Tareas', heading: 'Tu día perfecto!' },
  { name: 'Editar', heading: 'Editar metas' },
  { name: 'Hoy', heading: 'Galardones' },
  { name: 'Año', heading: /^Año \d{4}$/ },
  { name: 'Ajustes', heading: 'Ajustes' },
]

const button = (page: Page, name: string) =>
  page.getByRole('navigation').getByRole('button', { name, exact: true })

const leftEdge = async (page: Page, name: string) => (await button(page, name).boundingBox())?.x

for (const { name, heading } of SECTIONS) {
  test(`${name}: la sección activa queda sola a la izquierda y es accesible`, async ({
    page,
    baseURL,
  }) => {
    const problems = await watchProblems(page, baseURL)
    await page.goto('/')

    await button(page, name).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(heading)
    // La activa en el margen izquierdo; la más cercana, a más de dos botones de distancia.
    await expect.poll(() => leftEdge(page, name)).toBeLessThan(20)
    for (const other of SECTIONS.filter((section) => section.name !== name)) {
      await expect.poll(() => leftEdge(page, other.name)).toBeGreaterThan(150)
    }
    const { violations } = await new AxeBuilder({ page }).analyze()
    expect(violations).toEqual([])
    expect(problems).toEqual([])
  })
}

test('la barra se anima al cambiar de sección', async ({ page }) => {
  await page.goto('/')

  await button(page, 'Año').click()

  await page.waitForFunction(() =>
    [...document.querySelectorAll('nav li')].some(
      (item) => getComputedStyle(item).transform !== 'none',
    ),
  )
})

test('no se anima si el móvil pide reducir el movimiento', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const moved = await page.evaluate(async () => {
    const year = document.querySelector<HTMLButtonElement>('nav button[aria-label="Año"]')
    year?.click()
    let seen = false
    for (let frame = 0; frame < 20; frame += 1) {
      await new Promise(requestAnimationFrame)
      // En los dos primeros fotogramas aún se coloca cada botón; animado, se mueven muchos más.
      if (frame < 2) continue
      seen ||= [...document.querySelectorAll('nav li')].some(
        (item) => getComputedStyle(item).transform !== 'none',
      )
    }
    return seen
  })

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Año \d{4}$/)
  expect(moved).toBe(false)
})

test('usa la tipografía incluida en la app', async ({ page }) => {
  await page.goto('/')

  await expect
    .poll(() =>
      page.evaluate(async () => {
        await document.fonts.ready
        return [...document.fonts]
          .filter((font) => font.status === 'loaded')
          .map((font) => font.style)
          .sort()
      }),
    )
    .toEqual(['italic', 'normal'])
})

test.describe('en un móvil en inglés', () => {
  test.use({ locale: 'en-US' })

  test('muestra los textos en inglés', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Your perfect day!')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})
