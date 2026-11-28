import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PresetId } from '../../domain/goal'
import { preset } from '../../domain/testing'
import { renderApp } from '../../test/render'

vi.mock('../../platform/lifecycle', async () => (await import('../../test/platform')).lifecycleMock)

afterEach(() => {
  vi.unstubAllGlobals()
})

const PRESETS: PresetId[] = ['read', 'study', 'exercise', 'water', 'meditate', 'sleep']

/** Abre «Galardones» con las primeras `total` metas de ejemplo y las `done` primeras cumplidas. */
async function openAwards(done: number, total: number, language: 'es' | 'en' = 'es') {
  const app = await renderApp({ language })
  const { getState } = app.store
  act(() => {
    for (const id of PRESETS.slice(0, total)) getState().addGoal(preset(id))
    for (const goal of getState().data.goals.slice(0, done)) getState().toggle(goal.id)
  })
  await userEvent.click(screen.getByRole('button', { name: language === 'es' ? 'Hoy' : 'Today' }))
  return app
}

const heading = (name: string) => screen.getByRole('heading', { level: 2, name })
const tile = (name: string) => {
  const element = heading(name).parentElement
  if (!element) throw new Error(`Falta la ficha ${name}`)
  return element
}
/** La tira que contiene ese texto en su título. */
const strip = (title: string | RegExp) => {
  const element = screen
    .getAllByRole('heading')
    .find((item) =>
      typeof title === 'string' ? item.textContent.startsWith(title) : title.test(item.textContent),
    )
    ?.closest<HTMLElement>('[data-strip]')
  if (!element) throw new Error(`Falta la tira ${String(title)}`)
  return element
}
const toggle = (title: string) => within(strip(title)).getByRole('button')
const achievementRows = (title: string) =>
  within(strip(title))
    .getAllByRole('listitem')
    .map((item) => item.textContent)
const celebration = () => screen.queryByTestId('celebration')

describe('galardón de hoy', () => {
  it('sin metas explica dónde añadirlas', async () => {
    await openAwards(0, 0)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Galardones')
    expect(tile('Sin metas')).toHaveTextContent('Añade una meta desde Tareas.')
    expect(screen.queryByRole('heading', { name: 'Rachas' })).not.toBeInTheDocument()
  })

  it('un día sin metas programadas es libre', async () => {
    const app = await renderApp()
    act(() => {
      app.store.getState().addGoal(preset('read', [1]))
    })
    await userEvent.click(screen.getByRole('button', { name: 'Hoy' }))

    expect(tile('Día libre')).toHaveTextContent('Hoy no toca ninguna meta.')
    expect(celebration()).not.toBeInTheDocument()
  })

  it('sin nada marcado está por empezar', async () => {
    await openAwards(0, 2)

    expect(tile('Por empezar')).toHaveTextContent('0 de 2 metas')
    expect(tile('Por empezar')).not.toHaveTextContent('puntos')
  })

  it('a medias enseña lo cumplido y cuándo se suman los puntos', async () => {
    await openAwards(3, 5)

    expect(tile('En marcha')).toHaveTextContent('3 de 5 metas · +30 puntos mañana a las 8:00')
    expect(celebration()).not.toBeInTheDocument()
  })

  it('habla en singular cuando solo hay una meta', async () => {
    await openAwards(0, 1)

    expect(tile('Por empezar')).toHaveTextContent('0 de 1 meta')
  })

  it('no habla de colores, que son cosa del año', async () => {
    await openAwards(6, 6)

    expect(screen.queryByText(/verde/i)).not.toBeInTheDocument()
  })

  it('celebra el día perfecto', async () => {
    await openAwards(2, 2)

    expect(tile('Día perfecto')).toHaveTextContent('2 de 2 metas · +30 puntos mañana a las 8:00')
    expect(celebration()).toBeInTheDocument()
  })

  it('no celebra con animación si el móvil pide reducir el movimiento', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }))
    await openAwards(1, 1)

    expect(tile('Día perfecto')).toBeInTheDocument()
    expect(celebration()).not.toBeInTheDocument()
  })
})

const goalTitles = () =>
  within(screen.getByRole('region', { name: 'Rachas' }))
    .getAllByRole('heading', { level: 3 })
    .map((item) => item.textContent.trim())

/** Viernes a mediodía, con un reloj que la prueba puede adelantar. */
async function openWithClock() {
  const clock = { now: new Date(2026, 10, 27, 12) }
  const app = await renderApp({ now: () => clock.now })
  const goTo = (day: number, hour: number) => {
    clock.now = new Date(2026, 10, day, hour)
    act(() => {
      app.store.getState().refreshDay()
    })
  }
  const completeToday = () => {
    act(() => {
      const { data, today, toggle } = app.store.getState()
      for (const id of data.days[today]?.scheduled ?? []) toggle(id)
    })
  }
  return { ...app, goTo, completeToday }
}

describe('racha perfecta', () => {
  it('sin ningún día completo invita a empezar', async () => {
    await openAwards(0, 1)

    expect(strip('0 días perfectos seguidos')).toHaveTextContent(
      'Completa un día entero para empezar',
    )
  })

  it('con el día completo es el récord', async () => {
    await openAwards(1, 1)

    expect(strip('1 día perfecto seguido')).toHaveTextContent('Es el récord')
  })

  it('al romperse recuerda el récord', async () => {
    const app = await openWithClock()
    act(() => {
      app.store.getState().addGoal(preset('read'))
    })
    app.completeToday()
    app.goTo(29, 12)
    await userEvent.click(screen.getByRole('button', { name: 'Hoy' }))

    expect(strip('0 días perfectos seguidos')).toHaveTextContent('Récord: 1 día')
  })
})

describe('metas', () => {
  it('cada meta activa es una tira con su racha', async () => {
    await openAwards(1, 2)

    expect(goalTitles()).toEqual([
      expect.stringMatching(/^Estudiar 1 h\s*1 día seguido$/),
      expect.stringMatching(/^Leer 30 min\s*Sin racha todavía$/),
    ])
  })

  it('incluye las metas que hoy no tocan', async () => {
    const app = await renderApp()
    act(() => {
      app.store.getState().addGoal(preset('read', [1]))
    })
    await userEvent.click(screen.getByRole('button', { name: 'Hoy' }))

    expect(goalTitles()).toHaveLength(1)
  })

  it('crece con los días y se rompe solo en la meta fallada', async () => {
    const app = await openWithClock()
    act(() => {
      app.store.getState().addGoal(preset('read'))
      app.store.getState().addGoal(preset('study'))
    })
    app.completeToday()
    app.goTo(28, 12)
    act(() => {
      const [study] = app.store.getState().data.goals
      if (study) app.store.getState().toggle(study.id)
    })
    app.goTo(29, 12)
    await userEvent.click(screen.getByRole('button', { name: 'Hoy' }))

    expect(goalTitles()).toEqual([
      expect.stringMatching(/^Estudiar 1 h\s*2 días seguidos$/),
      expect.stringMatching(/^Leer 30 min\s*Sin racha todavía$/),
    ])
  })

  it('al tocar una tira se despliegan sus logros y se vuelven a recoger', async () => {
    await openAwards(1, 1)
    const button = toggle('Leer 30 min')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(within(strip('Leer 30 min')).queryByRole('list')).not.toBeInTheDocument()

    await userEvent.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    const rows = achievementRows('Leer 30 min')
    expect(rows).toHaveLength(6)
    expect(rows[0]).toBe('10 días seguidos 1 de 10 +100 puntos')
    expect(rows[1]).toBe('25 días seguidos Pendiente +250 puntos')
    expect(rows[5]).toBe('365 días seguidos Pendiente +3650 puntos')

    await userEvent.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(within(strip('Leer 30 min')).queryByRole('list')).not.toBeInTheDocument()
  })
})

describe('reto de días perfectos', () => {
  it('enseña el próximo y lo que falta', async () => {
    await openAwards(1, 1)

    expect(strip('10 días perfectos')).toHaveTextContent('Faltan 9 · +200 puntos')
  })

  it('al tocarlo se ven todos', async () => {
    await openAwards(0, 1)

    await userEvent.click(toggle('10 días perfectos'))

    const rows = achievementRows('10 días perfectos')
    expect(rows).toHaveLength(6)
    expect(rows[0]).toBe('10 días perfectos 0 de 10 +200 puntos')
  })

  it('diez días seguidos desbloquean logros que suman al nivel al día siguiente', async () => {
    const app = await openWithClock()
    act(() => {
      app.store.getState().addGoal(preset('read'))
    })
    for (let day = 27; day < 37; day += 1) {
      app.goTo(day, 12)
      app.completeToday()
    }
    await userEvent.click(screen.getByRole('button', { name: 'Hoy' }))

    // 15 puntos del día, 100 del logro de la meta y 200 del de días perfectos.
    expect(tile('Día perfecto')).toHaveTextContent('+315 puntos mañana a las 8:00')
    expect(strip('25 días perfectos')).toHaveTextContent('Faltan 15 · +500 puntos')
    await userEvent.click(toggle('Leer 30 min'))
    expect(achievementRows('Leer 30 min')[0]).toBe('10 días seguidos Conseguido +100 puntos')
    expect(strip('Nivel 2')).toHaveTextContent('135 puntos')

    app.goTo(37, 8)

    expect(strip('Nivel 3')).toHaveTextContent('450 puntos')
  })
})

describe('nivel', () => {
  it('no cuenta los puntos de hoy', async () => {
    await openAwards(3, 5)

    expect(strip('Nivel 1')).toHaveTextContent('0 puntos')
    expect(strip('Nivel 1')).toHaveTextContent('Faltan 100 para el nivel 2')
    const bar = screen.getByRole('progressbar', { name: 'Progreso hacia el nivel 2' })
    expect(bar).toHaveAttribute('aria-valuenow', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('suma los de ayer a las 8:00 de la mañana', async () => {
    const app = await openWithClock()
    act(() => {
      app.store.getState().addGoal(preset('read'))
      app.store.getState().addGoal(preset('study'))
    })
    app.completeToday()
    await userEvent.click(screen.getByRole('button', { name: 'Hoy' }))

    app.goTo(28, 7)
    expect(strip('Nivel 1')).toHaveTextContent('0 puntos')
    expect(strip('Nivel 1')).toHaveTextContent('+30 de ayer a las 8:00')

    app.goTo(28, 8)
    expect(strip('Nivel 1')).toHaveTextContent('30 puntos')
    expect(strip('Nivel 1')).not.toHaveTextContent('de ayer')
    expect(strip('Nivel 1')).toHaveTextContent('Faltan 70 para el nivel 2')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30')
  })

  it('se traduce al inglés', async () => {
    await openAwards(2, 2, 'en')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Awards')
    expect(tile('Perfect day')).toHaveTextContent('2 of 2 goals · +30 points tomorrow at 8:00')
    expect(strip('1 perfect day in a row')).toHaveTextContent('This is your best')
    expect(strip('Level 1')).toHaveTextContent('100 to reach level 2')
    expect(strip('10 perfect days')).toHaveTextContent('9 to go · +200 points')
    expect(screen.getByRole('region', { name: 'Streaks' })).toHaveTextContent('1 day in a row')
  })
})
