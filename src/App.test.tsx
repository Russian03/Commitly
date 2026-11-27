import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import pkg from '../package.json' with { type: 'json' }
import { DATA_KEY } from './data/repository'
import { memoryStorage } from './data/testing'
import { system } from './test/platform'
import { renderApp } from './test/render'

vi.mock('./platform/lifecycle', async () => (await import('./test/platform')).lifecycleMock)

const title = () => screen.getByRole('heading', { level: 1 })
const click = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }))
const goTo = (name: string) =>
  userEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name }))
const clickCard = (title: string) => click(new RegExp(`^${title} `))
const pressBack = () => {
  act(() => {
    system.pressBack()
  })
}

beforeEach(() => {
  system.minimize.mockClear()
})

describe('secciones', () => {
  it('abre en Tareas con el titular y el logo', async () => {
    await renderApp()

    expect(title()).toHaveAccessibleName('Tu día perfecto!')
    expect(screen.getByRole('img', { name: 'Commitly' })).toBeInTheDocument()
    expect(screen.getByRole('button', { current: 'page' })).toHaveAccessibleName('Tareas')
  })

  it('destaca en cursiva la primera palabra del titular', async () => {
    await renderApp()

    expect(title().querySelector('em')).toHaveTextContent('Tu')
  })

  it('lleva un ® decorativo tras la primera línea, que los lectores de pantalla ignoran', async () => {
    await renderApp()

    const mark = title().querySelector('sup')

    expect(mark).toHaveTextContent('®')
    expect(mark).toHaveAttribute('aria-hidden', 'true')
    expect(title()).toHaveTextContent('Tu día® perfecto!')
  })

  it('la barra tiene cinco secciones, con el lápiz tras las tareas', async () => {
    await renderApp()

    const names = within(screen.getByRole('navigation'))
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'))

    expect(names).toEqual(['Tareas', 'Editar', 'Hoy', 'Año', 'Ajustes'])
  })

  it.each([
    ['Editar', 'Editar metas'],
    ['Hoy', 'Galardones'],
    ['Año', 'Año 2026'],
    ['Ajustes', 'Ajustes'],
  ])('la sección %s muestra su título y queda activa', async (section, heading) => {
    await renderApp()

    await goTo(section)

    expect(title()).toHaveTextContent(heading)
    expect(screen.getByRole('button', { current: 'page' })).toHaveAccessibleName(section)
  })

  it('el título de Año sigue al día de la app', async () => {
    await renderApp({ now: () => new Date(2028, 1, 29, 12) })

    await goTo('Año')

    expect(title()).toHaveTextContent('Año 2028')
  })

  it('muestra en Ajustes la versión de package.json', async () => {
    await renderApp()

    await goTo('Ajustes')

    expect(screen.getByText(`Versión ${pkg.version}`)).toBeInTheDocument()
  })

  it('está disponible en inglés', async () => {
    await renderApp({ language: 'en' })

    expect(title()).toHaveAccessibleName('Your perfect day!')
    await goTo('Settings')
    expect(screen.getByText(`Version ${pkg.version}`)).toBeInTheDocument()
  })
})

describe('botón atrás', () => {
  it('desde otra sección vuelve a Tareas', async () => {
    await renderApp()
    await goTo('Año')

    pressBack()

    expect(title()).toHaveAccessibleName('Tu día perfecto!')
    expect(system.minimize).not.toHaveBeenCalled()
  })

  it('cierra las páginas de una en una', async () => {
    await renderApp()
    await click('Añadir nueva meta')
    await clickCard('Leer 30 min')

    pressBack()
    expect(title()).toHaveTextContent('Añadir meta')
    pressBack()
    expect(title()).toHaveAccessibleName('Tu día perfecto!')
  })

  it('en el inicio manda la app a segundo plano', async () => {
    await renderApp()

    pressBack()

    expect(system.minimize).toHaveBeenCalledOnce()
  })

  it('la tecla Escape cierra la página, pero nunca la app', async () => {
    await renderApp()
    await click('Añadir nueva meta')

    await userEvent.keyboard('{Escape}')
    expect(title()).toHaveAccessibleName('Tu día perfecto!')
    await userEvent.keyboard('{Escape}')

    expect(system.minimize).not.toHaveBeenCalled()
  })
})

describe('estados de los datos', () => {
  it('con datos dañados avisa y solo empieza de cero tras confirmarlo', async () => {
    const storage = memoryStorage({ [DATA_KEY]: 'roto' })
    await renderApp({ storage })

    expect(title()).toHaveTextContent('No se pueden leer los datos')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()

    await click('Empezar de cero')
    expect(storage.entries.get(DATA_KEY)).toBe('roto')

    await click('Sí, empezar de cero')
    expect(title()).toHaveAccessibleName('Tu día perfecto!')
  })

  it('permite echarse atrás antes de empezar de cero', async () => {
    const storage = memoryStorage({ [DATA_KEY]: 'roto' })
    await renderApp({ storage })

    await click('Empezar de cero')
    await click('Cancelar')

    expect(screen.getByRole('button', { name: 'Empezar de cero' })).toBeInTheDocument()
    expect(storage.entries.get(DATA_KEY)).toBe('roto')
  })

  it('«atrás» también saca de estas pantallas', async () => {
    await renderApp({ storage: memoryStorage({ [DATA_KEY]: '{"schemaVersion":99}' }) })

    pressBack()

    expect(system.minimize).toHaveBeenCalledOnce()
  })

  it('con datos de una versión más nueva pide actualizar', async () => {
    await renderApp({ storage: memoryStorage({ [DATA_KEY]: '{"schemaVersion":99}' }) })

    expect(title()).toHaveTextContent('Actualiza Commitly')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('si no puede leer ofrece reintentar', async () => {
    const memory = memoryStorage()
    let fail = true
    await renderApp({
      storage: {
        ...memory,
        get: (key) => (fail ? Promise.reject(new Error('sin acceso')) : memory.get(key)),
      },
    })
    expect(title()).toHaveTextContent('No se han podido cargar los datos')

    fail = false
    await click('Reintentar')

    expect(await screen.findByRole('navigation')).toBeInTheDocument()
  })

  it('si no puede guardar lo avisa y permite reintentar', async () => {
    const memory = memoryStorage()
    let fail = false
    await renderApp({
      storage: {
        ...memory,
        set: (key, value) =>
          fail ? Promise.reject(new Error('disco lleno')) : memory.set(key, value),
      },
    })
    fail = true

    await click('Añadir nueva meta')
    await clickCard('Leer 30 min')
    await click('Añadir')

    expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido guardar')
    fail = false
    await click('Reintentar')
    await vi.waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
    expect(memory.entries.get(DATA_KEY)).toContain('"preset":"read"')
  })
})
