import type { Page } from '@playwright/test'

/** Anota todo lo que no debe pasar mientras se usa la app. */
export async function watchProblems(page: Page, baseURL = '') {
  const problems: string[] = []
  page.on('pageerror', (error) => problems.push(error.message))
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) problems.push(message.text())
  })
  page.on('request', (request) => {
    const url = request.url()
    if (!url.startsWith(`${baseURL}/`) && !url.startsWith('data:')) {
      problems.push(`Petición externa: ${url}`)
    }
  })
  // La consola no recoge todos los bloqueos de la política de seguridad.
  await page.exposeFunction('reportViolation', (detail: string) => problems.push(detail))
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      const { reportViolation } = window as unknown as { reportViolation: (text: string) => void }
      reportViolation(`CSP: ${event.violatedDirective} ${event.blockedURI}`)
    })
  })
  return problems
}
