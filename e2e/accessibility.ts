import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * El titular y las tarjetas aparecen con un fundido y la revisión mide colores, así que antes
 * espera a que todo sea opaco.
 */
export async function expectAccessible(page: Page) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll('h1 > span, main li')].every(
      (element) => getComputedStyle(element).opacity === '1',
    ),
  )
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations).toEqual([])
}
