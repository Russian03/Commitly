import { describe, expect, it } from 'vitest'
import { closePages, goBack, goTo, openPage, START } from './navigation'

const catalog = openPage(START, { kind: 'catalog' })
const create = openPage(catalog, { kind: 'create', preset: 'read' })

describe('navegación', () => {
  it('empieza en Tareas sin páginas abiertas', () => {
    expect(START).toEqual({ section: 'tasks', pages: [] })
  })

  it('apila páginas', () => {
    expect(create.pages.map((page) => page.kind)).toEqual(['catalog', 'create'])
  })

  it('atrás cierra la última página', () => {
    expect(goBack(create)).toEqual(catalog)
    expect(goBack(catalog)).toEqual(START)
  })

  it('atrás desde otra sección vuelve a Tareas', () => {
    expect(goBack(goTo('year'))).toEqual(START)
  })

  it('atrás en el inicio no tiene a dónde ir', () => {
    expect(goBack(START)).toBeNull()
  })

  it('cierra todas las páginas conservando la sección', () => {
    expect(closePages(create)).toEqual(START)
  })
})
