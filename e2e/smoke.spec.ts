import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('arranca sin errores y sin salir del propio origen', async ({ page, baseURL }) => {
  const errors: string[] = []
  const external: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('request', (request) => {
    const url = request.url()
    if (!url.startsWith(`${baseURL ?? ''}/`) && !url.startsWith('data:')) external.push(url)
  })

  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: 'Commitly' })).toBeVisible()
  expect(errors).toEqual([])
  expect(external).toEqual([])
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

test('no tiene fallos de accesibilidad detectables', async ({ page }) => {
  await page.goto('/')

  const { violations } = await new AxeBuilder({ page }).analyze()

  expect(violations).toEqual([])
})
