import type { Icon } from '@phosphor-icons/react'
import { GearSixIcon } from '@phosphor-icons/react/GearSix'
import { SquaresFourIcon } from '@phosphor-icons/react/SquaresFour'
import { ListChecksIcon } from '@phosphor-icons/react/ListChecks'
import { MedalIcon } from '@phosphor-icons/react/Medal'
import type { ComponentType } from 'react'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { TasksScreen } from '../features/tasks/TasksScreen'
import { TodayScreen } from '../features/today/TodayScreen'
import { YearScreen } from '../features/year/YearScreen'

export type SectionId = 'tasks' | 'today' | 'year' | 'settings'

interface Section {
  readonly id: SectionId
  readonly icon: Icon
  readonly Screen: ComponentType
}

/** En el orden de la barra inferior. */
export const SECTIONS: readonly Section[] = [
  { id: 'tasks', icon: ListChecksIcon, Screen: TasksScreen },
  { id: 'today', icon: MedalIcon, Screen: TodayScreen },
  { id: 'year', icon: SquaresFourIcon, Screen: YearScreen },
  { id: 'settings', icon: GearSixIcon, Screen: SettingsScreen },
]
