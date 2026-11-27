import type { Page } from '../../app/navigation'
import { CatalogPage } from './CatalogPage'
import { CreateGoalPage } from './CreateGoalPage'
import { EditGoalPage } from './EditGoalPage'

export function TaskPage({ page }: { readonly page: Page }) {
  switch (page.kind) {
    case 'catalog':
      return <CatalogPage />
    case 'create':
      return <CreateGoalPage preset={page.preset} />
    case 'edit':
      return <EditGoalPage id={page.id} />
  }
}
