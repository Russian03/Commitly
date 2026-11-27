import type { GoalId, PresetId } from '../domain/goal'

export type SectionId = 'tasks' | 'edit' | 'today' | 'year' | 'settings'

/** Páginas a pantalla completa que se abren sobre una sección. */
export type Page =
  | { readonly kind: 'catalog' }
  /** `preset` es `null` al crear una meta propia. */
  | { readonly kind: 'create'; readonly preset: PresetId | null }
  | { readonly kind: 'edit'; readonly id: GoalId }

export interface Navigation {
  readonly section: SectionId
  readonly pages: readonly Page[]
}

export const START: Navigation = { section: 'tasks', pages: [] }

export const goTo = (section: SectionId): Navigation => ({ section, pages: [] })

export const openPage = (navigation: Navigation, page: Page): Navigation => ({
  ...navigation,
  pages: [...navigation.pages, page],
})

export const closePages = (navigation: Navigation): Navigation => goTo(navigation.section)

/** A dónde lleva «atrás», o `null` si ya se está en el inicio. */
export function goBack(navigation: Navigation): Navigation | null {
  if (navigation.pages.length > 0) {
    return { ...navigation, pages: navigation.pages.slice(0, -1) }
  }
  return navigation.section === START.section ? null : START
}
