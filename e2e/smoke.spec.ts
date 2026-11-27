import { expect, test } from '@playwright/test'
import { watchProblems } from './watch'

test('arranca sin errores y sin salir del propio origen', async ({ page, baseURL }) => {
  const problems = await watchProblems(page, baseURL)

  await page.goto('/')

  await expect(page.getByRole('img', { name: 'Commitly' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect(problems).toEqual([])
})

test('la compilación lleva una política de seguridad de contenido estricta', async ({ page }) => {
  await page.goto('/')

  const policy = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content')

  expect(policy).toContain("script-src 'self'")
  expect(policy).toContain("connect-src 'self'")
  expect(policy).not.toContain('unsafe-eval')
})
