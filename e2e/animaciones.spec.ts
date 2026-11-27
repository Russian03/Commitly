import { expect, test } from '@playwright/test'
import { watchProblems } from './watch'

test.use({ locale: 'es-ES' })

test('marcar una meta lanza chispas que después desaparecen', async ({ page, baseURL }) => {
  const problems = await watchProblems(page, baseURL)
  await page.goto('/')
  await page.getByRole('button', { name: 'Añadir nueva meta' }).click()
  await page.getByRole('button', { name: /^Leer 30 min / }).click()
  await page.getByRole('button', { name: 'Añadir', exact: true }).click()

  await page.getByRole('button', { name: /^Leer 30 min / }).click()

  await expect(page.locator('canvas')).toHaveCount(1)
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(problems).toEqual([])
})
