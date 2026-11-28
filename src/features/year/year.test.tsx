import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PresetId } from '../../domain/goal'
import { preset } from '../../domain/testing'
import { renderApp } from '../../test/render'

vi.mock('../../platform/lifecycle', async () => (await import('../../test/platform')).lifecycleMock)

const PRESETS: PresetId[] = ['read', 'study', 'exercise', 'water', 'meditate', 'sleep']

/** La app con un reloj que la prueba puede mover. Empieza el viernes 27 de noviembre de 2026. */
async function openApp(start = new Date(2026, 10, 27, 12), language: 'es' | 'en' = 'es') {
  const clock = { now: start }
  const app = await renderApp({ language, now: () => clock.now })
  const state = () => app.store.getState()
  const moveTo = (date: Date) => {
    clock.now = date
    act(() => {
      state().refreshDay()
    })
  }
  /** Añade las primeras `total` metas de ejemplo y cumple las `done` primeras. */
  const addGoals = (total: number, done = 0) => {
    act(() => {
      for (const id of PRESETS.slice(0, total)) state().addGoal(preset(id))
      for (const goal of state().data.goals.slice(0, done)) state().toggle(goal.id)
    })
  }
  const openYear = async () => {
    await userEvent.click(screen.getByRole('button', { name: language === 'es' ? 'Año' : 'Year' }))
  }
  return { ...app, moveTo, addGoals, openYear }
}

const title = () => screen.getByRole('heading', { level: 1 })
const grid = (year = 2026) => screen.getByRole('group', { name: `Días de ${year}` })
const days = (year = 2026) => within(grid(year)).getAllByRole('button')
const day = (name: RegExp) => screen.getByRole('button', { name })
/** La tira que cuenta cómo fue el día elegido. */
const detail = () => {
  const element = screen.getByRole('heading', { level: 2 }).closest<HTMLElement>('[data-strip]')
  if (!element) throw new Error('Falta el detalle del día')
  return element
}
const pressed = () => days().filter((button) => button.getAttribute('aria-pressed') === 'true')
const tabStops = (year?: number) => days(year).filter((button) => button.tabIndex === 0)

describe('cuadrícula del año', () => {
  it('tiene un cuadro por cada día, en orden', async () => {
    const app = await openApp()
    await app.openYear()

    expect(title()).toHaveTextContent('Año 2026')
    expect(days()).toHaveLength(365)
    expect(days()[0]).toHaveAccessibleName(/^1 de enero: /)
    expect(days()[364]).toHaveAccessibleName(/^31 de diciembre: /)
  })

  it('tiene 366 en un año bisiesto', async () => {
    const app = await openApp(new Date(2028, 0, 5, 12))
    await app.openYear()

    expect(days(2028)).toHaveLength(366)
  })

  it('reparte las columnas según el hueco', async () => {
    const app = await openApp()
    await app.openYear()

    // El hueco de las pruebas mide 361 × 500.
    expect(grid().style.gridTemplateColumns).toBe('repeat(16, 18px)')
  })

  it('señala hoy sin elegir ningún día', async () => {
    const app = await openApp()
    app.addGoals(2, 1)
    await app.openYear()

    const today = day(/^27 de noviembre: /)
    expect(today).toHaveAttribute('aria-current', 'date')
    expect(today).toHaveAccessibleName('27 de noviembre: Hoy · 1 de 2 metas, Verde 1 de 4')
    expect(pressed()).toEqual([])
    expect(detail()).toHaveTextContent('Elige un díaToca un cuadro para verloOtro toque lo cierra')
  })

  it('pinta cada día según su color y deja el futuro sin pintar', async () => {
    const app = await openApp()
    app.addGoals(6, 6)
    app.moveTo(new Date(2026, 10, 28, 12))
    await app.openYear()

    expect(day(/^27 de noviembre: /)).toHaveAttribute('data-level', '4')
    expect(day(/^28 de noviembre: /)).toHaveAttribute('data-level', '0')
    expect(day(/^28 de noviembre: /)).toHaveAttribute('data-timing', 'today')
    expect(day(/^29 de noviembre: /)).toHaveAttribute('data-timing', 'future')
    expect(day(/^26 de noviembre: /)).toHaveAttribute('data-timing', 'past')
  })
})

describe('detalle de un día', () => {
  it('al tocar un día cuenta cómo fue', async () => {
    const app = await openApp()
    app.addGoals(2, 2)
    app.moveTo(new Date(2026, 10, 28, 12))
    await app.openYear()

    await userEvent.click(day(/^27 de noviembre: /))

    expect(day(/^27 de noviembre: /)).toHaveAttribute('aria-pressed', 'true')
    expect(day(/^28 de noviembre: /)).toHaveAttribute('aria-pressed', 'false')
    expect(detail()).toHaveTextContent('Viernes · 2 de 2 metasDía perfecto · verde 1 de 4')
  })

  it('al tocarlo otra vez se suelta', async () => {
    const app = await openApp()
    app.addGoals(1, 1)
    await app.openYear()

    await userEvent.click(day(/^27 de noviembre: /))
    expect(detail()).toHaveTextContent('Hoy · 1 de 1 meta')
    await userEvent.click(day(/^27 de noviembre: /))

    expect(pressed()).toEqual([])
    expect(detail()).toHaveTextContent('Elige un día')
  })

  it('solo hay un día elegido a la vez', async () => {
    const app = await openApp()
    await app.openYear()

    await userEvent.click(day(/^26 de noviembre: /))
    await userEvent.click(day(/^2 de enero: /))

    expect(pressed()).toEqual([day(/^2 de enero: /)])
    expect(detail()).toHaveTextContent('2 de enero')
  })

  it('al salir y volver no queda ninguno elegido', async () => {
    const app = await openApp()
    await app.openYear()
    await userEvent.click(day(/^26 de noviembre: /))

    await userEvent.click(screen.getByRole('button', { name: 'Tareas' }))
    await app.openYear()

    expect(pressed()).toEqual([])
  })

  it.each([
    ['un día sin nada hecho', /^27 de noviembre: /, 'Viernes · 0 de 1 metaSin color'],
    ['un día libre', /^28 de noviembre: /, 'SábadoDía libre'],
    ['un día anterior a empezar', /^2 de enero: /, 'ViernesSin registro'],
    ['un día por llegar', /^31 de diciembre: /, 'JuevesTodavía no ha llegado'],
  ])('distingue %s', async (_, name, text) => {
    const app = await openApp()
    act(() => {
      // Solo toca los viernes.
      app.store.getState().addGoal(preset('read', [5]))
    })
    app.moveTo(new Date(2026, 10, 29, 12))
    await app.openYear()

    await userEvent.click(day(name))

    expect(detail()).toHaveTextContent(text)
  })

  it('se recorre con las flechas del teclado', async () => {
    const app = await openApp()
    await app.openYear()
    const today = day(/^27 de noviembre: /)
    expect(tabStops()).toEqual([today])
    today.focus()

    await userEvent.keyboard('{ArrowLeft}')
    expect(day(/^26 de noviembre: /)).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    expect(day(/^28 de noviembre: /)).toHaveFocus()
    // Con 16 columnas, arriba y abajo saltan 16 días.
    await userEvent.keyboard('{ArrowUp}')
    expect(day(/^12 de noviembre: /)).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(day(/^28 de noviembre: /)).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(day(/^1 de enero: /)).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(day(/^1 de enero: /)).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(day(/^31 de diciembre: /)).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    expect(detail()).toHaveTextContent('Todavía no ha llegado')

    await userEvent.keyboard('{Enter}')
    expect(detail()).toHaveTextContent('Elige un día')
    // La parada del teclado no salta a hoy al soltar un día.
    expect(tabStops()).toEqual([day(/^31 de diciembre: /)])
  })
})

describe('colores', () => {
  it.each([
    [2, 0, 'Con 2 metas, el máximo de hoy es el verde 1 de 4.'],
    [1, 1, 'Con 1 meta, el máximo de hoy es el verde 1 de 4.'],
    [5, 0, 'Con 5 metas, el máximo de hoy es el verde 3 de 4.'],
    [6, 5, 'Hoy puedes llegar al verde más intenso.'],
    [6, 6, 'Verde más intenso conseguido.'],
  ])('con %i metas y %i cumplidas explica el máximo de hoy', async (total, done, text) => {
    const app = await openApp()
    app.addGoals(total, done)
    await app.openYear()

    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('sin metas hoy no habla del máximo', async () => {
    const app = await openApp()
    await app.openYear()

    expect(screen.queryByText(/máximo|intenso/)).not.toBeInTheDocument()
    expect(screen.getByText('Menos')).toBeInTheDocument()
    expect(screen.getByText('Más')).toBeInTheDocument()
  })
})

describe('cambio de año', () => {
  const previous = () => screen.queryByRole('button', { name: 'Año anterior' })
  const next = () => screen.queryByRole('button', { name: 'Año siguiente' })

  /** Con un día registrado en 2025 y el reloj ya en 2026. */
  async function openSecondYear() {
    const app = await openApp(new Date(2025, 11, 30, 12))
    app.addGoals(1, 1)
    app.moveTo(new Date(2026, 0, 2, 12))
    await app.openYear()
    return app
  }

  it('no aparece con un solo año', async () => {
    const app = await openApp()
    await app.openYear()

    expect(previous()).not.toBeInTheDocument()
    expect(next()).not.toBeInTheDocument()
  })

  it('va al año anterior y vuelve', async () => {
    await openSecondYear()
    expect(title()).toHaveTextContent('Año 2026')
    expect(next()).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Año anterior' }))

    expect(title()).toHaveTextContent('Año 2025')
    expect(previous()).toBeDisabled()
    expect(days(2025)).toHaveLength(365)
    // En un año anterior el teclado empieza por su último día registrado.
    expect(tabStops(2025)).toEqual([day(/^31 de diciembre: /)])

    await userEvent.click(screen.getByRole('button', { name: 'Año siguiente' }))

    expect(title()).toHaveTextContent('Año 2026')
    expect(tabStops()).toEqual([day(/^2 de enero: /)])
  })

  it('al cambiar de año se suelta el día elegido', async () => {
    await openSecondYear()
    await userEvent.click(day(/^2 de enero: /))

    await userEvent.click(screen.getByRole('button', { name: 'Año anterior' }))
    expect(detail()).toHaveTextContent('Elige un día')
    await userEvent.click(screen.getByRole('button', { name: 'Año siguiente' }))

    expect(detail()).toHaveTextContent('Elige un día')
  })

  it('en el año actual pasa solo al nuevo', async () => {
    const app = await openSecondYear()

    app.moveTo(new Date(2027, 0, 1, 12))

    expect(title()).toHaveTextContent('Año 2027')
    expect(day(/^1 de enero: /)).toHaveAttribute('aria-current', 'date')
  })

  it('si se está mirando un año anterior no se mueve', async () => {
    const app = await openSecondYear()
    await userEvent.click(screen.getByRole('button', { name: 'Año anterior' }))

    app.moveTo(new Date(2027, 0, 1, 12))

    expect(title()).toHaveTextContent('Año 2025')
  })
})

describe('en inglés', () => {
  it('traduce la pantalla', async () => {
    const app = await openApp(new Date(2026, 10, 27, 12), 'en')
    app.addGoals(2, 2)
    await app.openYear()

    expect(title()).toHaveTextContent('Year 2026')
    expect(screen.getByRole('group', { name: 'Days of 2026' })).toBeInTheDocument()
    expect(day(/^November 27: /)).toHaveAccessibleName(
      'November 27: Today · 2 of 2 goals, Perfect day · green 1 of 4',
    )
    expect(screen.getByText('With 2 goals, today tops out at green 1 of 4.')).toBeInTheDocument()
    expect(detail()).toHaveTextContent('Pick a dayTap a square to see itTap it again to close')
  })
})
