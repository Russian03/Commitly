import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import pkg from '../package.json' with { type: 'json' }
import { App } from './App'
import { renderIn } from './test/render'

const title = () => screen.getByRole('heading', { level: 1 })
const goTo = (name: string) => userEvent.click(screen.getByRole('button', { name }))

afterEach(() => {
  vi.useRealTimers()
})

describe('App', () => {
  it('abre en Tareas con el titular y el logo', () => {
    renderIn('es', <App />)

    expect(title()).toHaveAccessibleName('Tu día perfecto!')
    expect(screen.getByRole('img', { name: 'Commitly' })).toBeInTheDocument()
    expect(screen.getByRole('button', { current: 'page' })).toHaveAccessibleName('Tareas')
  })

  it('destaca en cursiva la primera palabra del titular', () => {
    renderIn('es', <App />)

    expect(title().querySelector('em')).toHaveTextContent('Tu')
  })

  it('lleva un ® decorativo tras la primera línea, que los lectores de pantalla ignoran', () => {
    renderIn('es', <App />)

    const mark = title().querySelector('sup')

    expect(mark).toHaveTextContent('®')
    expect(mark).toHaveAttribute('aria-hidden', 'true')
    expect(title()).toHaveTextContent('Tu día® perfecto!')
  })

  it('el botón de añadir aún no está disponible', () => {
    renderIn('es', <App />)

    expect(screen.getByRole('button', { name: 'Añadir meta' })).toBeDisabled()
  })

  it.each([
    ['Hoy', 'Galardones'],
    ['Ajustes', 'Ajustes'],
  ])('la sección %s muestra su título y queda activa', async (section, heading) => {
    renderIn('es', <App />)

    await goTo(section)

    expect(title()).toHaveTextContent(heading)
    expect(screen.getByRole('button', { current: 'page' })).toHaveAccessibleName(section)
  })

  it('titula la sección Año con el año actual', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2028, 1, 29, 12))
    renderIn('es', <App />)

    await goTo('Año')

    expect(title()).toHaveTextContent('Año 2028')
  })

  it('vuelve a Tareas desde otra sección', async () => {
    renderIn('es', <App />)

    await goTo('Año')
    await goTo('Tareas')

    expect(title()).toHaveAccessibleName('Tu día perfecto!')
  })

  it('muestra en Ajustes la versión de package.json', async () => {
    renderIn('es', <App />)

    await goTo('Ajustes')

    expect(screen.getByText(`Versión ${pkg.version}`)).toBeInTheDocument()
  })

  it('está disponible en inglés', async () => {
    renderIn('en', <App />)

    expect(title()).toHaveAccessibleName('Your perfect day!')
    await goTo('Settings')
    expect(screen.getByText(`Version ${pkg.version}`)).toBeInTheDocument()
  })
})
