import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { custom, preset } from '../../domain/testing'
import { renderApp } from '../../test/render'

vi.mock('../../platform/lifecycle', async () => (await import('../../test/platform')).lifecycleMock)

const title = () => screen.getByRole('heading', { level: 1 })
const click = (name: string) => userEvent.click(screen.getByRole('button', { name }))
const goTo = (name: string) =>
  userEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name }))

/** Cada fila se llama por la meta seguida de sus días: «Leer 30 min Cada día». */
const row = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name} `) })
const openGoal = (name: string) => userEvent.click(row(name))

/** Viernes: «Leer» toca hoy y «Estudiar» solo los lunes. */
async function openEditor() {
  const app = await renderApp()
  app.store.getState().addGoal(preset('study', [1]))
  app.store.getState().addGoal(preset('read'))
  await goTo('Editar')
  return app
}

const goal = (app: Awaited<ReturnType<typeof renderApp>>, id: string) =>
  app.store.getState().data.goals.find((other) => other.id === id)

describe('editar metas', () => {
  it('sin metas lo explica', async () => {
    await renderApp()

    await goTo('Editar')

    expect(title()).toHaveTextContent('Editar metas')
    expect(screen.getByText('Aún no tienes metas.')).toBeInTheDocument()
  })

  it('lista todas las metas, toquen hoy o no, con el resumen de sus días', async () => {
    await openEditor()

    expect(row('Estudiar 1 h')).toHaveAccessibleName('Estudiar 1 h Lun')
    expect(row('Leer 30 min')).toHaveAccessibleName('Leer 30 min Cada día')
  })

  it('en la lista no se puede cambiar nada sin entrar en la meta', async () => {
    await openEditor()

    expect(within(screen.getByRole('main')).getAllByRole('button')).toHaveLength(2)
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })

  it('los días se cambian en la ficha y solo al guardar', async () => {
    const app = await openEditor()
    await openGoal('Estudiar 1 h')

    await click('Viernes')
    expect(goal(app, 'g1')?.weekdays).toEqual([1])
    await click('Guardar')

    expect(goal(app, 'g1')?.weekdays).toEqual([1, 5])
    expect(app.store.getState().data.days['2026-11-27']?.scheduled).toContain('g1')
    expect(row('Estudiar 1 h')).toHaveAccessibleName('Estudiar 1 h Lun, vie')
  })

  it('salir sin guardar no cambia los días', async () => {
    const app = await openEditor()
    await openGoal('Estudiar 1 h')
    await click('Viernes')

    await click('Volver')

    expect(goal(app, 'g1')?.weekdays).toEqual([1])
  })

  it('no deja guardar una meta sin días', async () => {
    const app = await openEditor()
    await openGoal('Estudiar 1 h')
    await click('Lunes')

    await click('Guardar')

    expect(screen.getByRole('alert')).toHaveTextContent('Elige al menos un día.')
    expect(goal(app, 'g1')?.weekdays).toEqual([1])
  })

  it('al tocar una meta se abre su ficha, y atrás vuelve a la lista', async () => {
    await openEditor()

    await openGoal('Leer 30 min')
    expect(title()).toHaveTextContent('Editar meta')
    await click('Volver')

    expect(title()).toHaveTextContent('Editar metas')
    expect(screen.getByRole('button', { current: 'page' })).toHaveAccessibleName('Editar')
  })

  it('cambia el nombre de una meta propia', async () => {
    const app = await renderApp()
    app.store.getState().addGoal(custom('Pintar'))
    await goTo('Editar')

    await openGoal('Pintar')
    const field = screen.getByRole('textbox', { name: 'Nombre' })
    expect(field).toHaveValue('Pintar')
    await userEvent.clear(field)
    await userEvent.type(field, 'Dibujar')
    await click('Guardar')

    expect(title()).toHaveTextContent('Editar metas')
    expect(row('Dibujar')).toBeInTheDocument()
  })

  it('quita la meta solo tras confirmarlo', async () => {
    const app = await openEditor()
    await openGoal('Leer 30 min')

    await click('Quitar meta')
    expect(screen.getByText('¿Quitarla? Dejará de contar desde hoy.')).toBeInTheDocument()
    await click('Cancelar')
    expect(goal(app, 'g2')?.removedOn).toBeNull()

    await click('Quitar meta')
    await click('Quitar')

    expect(title()).toHaveTextContent('Editar metas')
    expect(screen.queryByRole('button', { name: /^Leer 30 min / })).not.toBeInTheDocument()
  })
})
