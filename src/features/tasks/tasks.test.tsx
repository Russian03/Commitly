import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from '../../test/render'

vi.mock('../../platform/lifecycle', async () => (await import('../../test/platform')).lifecycleMock)

const title = () => screen.getByRole('heading', { level: 1 })
const button = (name: string | RegExp) => screen.getByRole('button', { name })
const click = (name: string | RegExp) => userEvent.click(button(name))
/** Una tarjeta se llama por su título seguido del dato: «Leer 30 min Cada día». */
const card = (title: string) => button(new RegExp(`^${title} `))
const clickCard = (title: string) => userEvent.click(card(title))

async function addPreset(name: string) {
  await click('Añadir nueva meta')
  await clickCard(name)
  await click('Añadir')
}

const section = (name: string) => {
  const heading = screen.getByRole('heading', { level: 2, name })
  const element = heading.closest('section')
  if (!element) throw new Error(`Falta la sección ${name}`)
  return within(element)
}

const cardNames = (name: string) =>
  section(name)
    .getAllByRole('listitem')
    .map((item) => item.querySelector('[data-title]')?.textContent)

describe('inicio', () => {
  it('sin metas solo ofrece la tarjeta para añadir', async () => {
    await renderApp()

    expect(cardNames('Hoy')).toEqual(['Añadir nueva meta'])
    expect(screen.queryByText('Hoy no toca ninguna meta.')).not.toBeInTheDocument()
  })

  it('la tarjeta para añadir va siempre al final y abre el catálogo', async () => {
    await renderApp()
    await addPreset('Leer 30 min')
    await addPreset('Meditar 10 min')

    expect(cardNames('Hoy')).toEqual(['Meditar 10 min', 'Leer 30 min', 'Añadir nueva meta'])
    await click('Añadir nueva meta')

    expect(title()).toHaveTextContent('Añadir meta')
  })

  it('no hay botones de añadir ni de editar fuera de las tarjetas', async () => {
    await renderApp()
    await addPreset('Leer 30 min')

    const main = within(screen.getByRole('main'))

    expect(main.getAllByRole('button')).toHaveLength(2)
  })

  it('solo muestra las metas de hoy', async () => {
    await renderApp()
    await click('Añadir nueva meta')
    await clickCard('Estudiar 1 h')
    await click('Viernes')
    await click('Añadir')

    expect(screen.queryByText('Estudiar 1 h')).not.toBeInTheDocument()
    expect(screen.getByText('Hoy no toca ninguna meta.')).toBeInTheDocument()
    expect(cardNames('Hoy')).toEqual(['Añadir nueva meta'])
  })
})

describe('catálogo', () => {
  it('ofrece las seis metas de ejemplo y una propia', async () => {
    await renderApp()
    await click('Añadir nueva meta')

    for (const name of [
      'Leer 30 min',
      'Estudiar 1 h',
      'Hacer ejercicio 30 min',
      'Beber 2 L de agua',
      'Meditar 10 min',
      'Dormir antes de las 23:00',
      'Crear la mía',
    ]) {
      expect(card(name)).toBeEnabled()
    }
    expect(title()).toHaveFocus()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('no deja repetir una meta ya añadida', async () => {
    await renderApp()
    await addPreset('Leer 30 min')

    await click('Añadir nueva meta')

    expect(card('Leer 30 min')).toBeDisabled()
    expect(card('Leer 30 min')).toHaveAccessibleName('Leer 30 min Ya añadida')
  })

  it('se cierra sin añadir nada', async () => {
    const { store } = await renderApp()
    await click('Añadir nueva meta')

    await click('Cerrar')

    expect(title()).toHaveAccessibleName('Tu día perfecto!')
    expect(store.getState().data.goals).toEqual([])
  })
})

describe('añadir', () => {
  it('propone todos los días y deja la meta arriba de la lista de hoy', async () => {
    await renderApp()
    await addPreset('Leer 30 min')
    await click('Añadir nueva meta')
    await clickCard('Beber 2 L de agua')

    for (const day of screen.getAllByRole('button', { name: /^(Lunes|Domingo)$/ })) {
      expect(day).toHaveAttribute('aria-pressed', 'true')
    }
    await click('Añadir')

    expect(cardNames('Hoy')).toEqual(['Beber 2 L de agua', 'Leer 30 min', 'Añadir nueva meta'])
    expect(card('Beber 2 L de agua')).toHaveAccessibleName('Beber 2 L de agua Cada día')
  })

  it('pide al menos un día', async () => {
    const { store } = await renderApp()
    await click('Añadir nueva meta')
    await clickCard('Meditar 10 min')
    for (const day of ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']) {
      await click(day)
    }

    await click('Añadir')

    expect(screen.getByRole('alert')).toHaveTextContent('Elige al menos un día.')
    expect(store.getState().data.goals).toEqual([])
    await click('Lunes')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('meta propia', () => {
  const openForm = async () => {
    await click('Añadir nueva meta')
    await clickCard('Crear la mía')
  }

  it('se crea escribiendo su nombre', async () => {
    await renderApp()
    await openForm()

    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), '  Tocar la guitarra ')
    await click('Añadir')

    expect(cardNames('Hoy')).toEqual(['Tocar la guitarra', 'Añadir nueva meta'])
  })

  it('también se envía con la tecla Intro', async () => {
    await renderApp()
    await openForm()

    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Pintar{Enter}')

    expect(cardNames('Hoy')).toEqual(['Pintar', 'Añadir nueva meta'])
  })

  it.each([
    ['', 'Escribe un nombre.'],
    ['a'.repeat(41), 'Máximo 40 caracteres.'],
  ])('explica por qué no admite «%s»', async (name, message) => {
    await renderApp()
    await openForm()
    const field = screen.getByRole('textbox', { name: 'Nombre' })
    if (name) await userEvent.type(field, name)

    await click('Añadir')

    expect(screen.getByRole('alert')).toHaveTextContent(message)
    expect(field).toHaveAttribute('aria-invalid', 'true')
    await userEvent.type(field, 'b')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('avisa si ya existe', async () => {
    await renderApp()
    await openForm()
    await userEvent.type(screen.getByRole('textbox'), 'Pintar{Enter}')
    await openForm()

    await userEvent.type(screen.getByRole('textbox'), 'pintar{Enter}')

    expect(screen.getByRole('alert')).toHaveTextContent('Ya tienes esa meta.')
  })
})

describe('marcar', () => {
  it('marca y desmarca la meta de hoy', async () => {
    const { store } = await renderApp()
    await addPreset('Leer 30 min')

    await clickCard('Leer 30 min')
    expect(card('Leer 30 min')).toHaveAttribute('aria-pressed', 'true')
    expect(card('Leer 30 min')).toHaveAccessibleName('Leer 30 min Hecho')
    expect(store.getState().data.days['2026-11-27']?.done).toEqual(['g1'])

    await clickCard('Leer 30 min')
    expect(card('Leer 30 min')).toHaveAttribute('aria-pressed', 'false')
  })

  it('celebra con chispas al marcar, pero no al añadir', async () => {
    const draw = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    await renderApp()
    await addPreset('Leer 30 min')

    await click('Añadir nueva meta')
    expect(draw).not.toHaveBeenCalled()
    await click('Cerrar')

    await clickCard('Leer 30 min')
    expect(draw).toHaveBeenCalledOnce()
    draw.mockRestore()
  })

  it('lo marcado se conserva al volver a abrir la app', async () => {
    const first = await renderApp()
    await addPreset('Leer 30 min')
    await clickCard('Leer 30 min')
    first.unmount()

    await renderApp({ storage: first.storage })

    expect(card('Leer 30 min')).toHaveAttribute('aria-pressed', 'true')
  })

  it('al cambiar de día la lista empieza sin marcar', async () => {
    const clock = { now: new Date(2026, 10, 27, 23, 59) }
    const { store } = await renderApp({ now: () => clock.now })
    await addPreset('Leer 30 min')
    await clickCard('Leer 30 min')

    clock.now = new Date(2026, 10, 28, 0, 1)
    act(() => {
      store.getState().refreshDay()
    })

    expect(card('Leer 30 min')).toHaveAttribute('aria-pressed', 'false')
  })
})
