/** El estado de la app: los datos, el día de hoy y cómo va el guardado. */
import { createStore } from 'zustand/vanilla'
import type { LoadResult, Repository } from '../data/repository'
import type { ActionResult } from '../domain/actions'
import { addGoal, removeGoal, toggleGoal, updateGoal } from '../domain/actions'
import type { AppData } from '../domain/appData'
import { createEmptyData } from '../domain/appData'
import type { DayKey } from '../domain/date'
import { toDayKey } from '../domain/date'
import type { GoalDraft, GoalError, GoalId } from '../domain/goal'
import { reconcile } from '../domain/history'
import { creditedThrough } from '../domain/points'

export type Status = 'loading' | 'ready' | 'corrupt' | 'unsupported' | 'load-error'

export interface AppState {
  readonly status: Status
  readonly data: AppData
  readonly today: DayKey
  /** Último día cuyos puntos ya cuentan para el nivel. */
  readonly creditedThrough: DayKey
  /** El último guardado falló: lo que se ve en pantalla aún no está en el dispositivo. */
  readonly saveFailed: boolean
  readonly load: () => Promise<void>
  /** Pasa de día si hace falta. Se llama al volver a la app y a medianoche. */
  readonly refreshDay: () => void
  readonly toggle: (id: GoalId) => void
  /** Devuelven el motivo del rechazo, o `null` si el cambio se ha hecho. */
  readonly addGoal: (draft: GoalDraft) => GoalError | null
  readonly updateGoal: (id: GoalId, draft: GoalDraft) => GoalError | null
  readonly removeGoal: (id: GoalId) => GoalError | null
  readonly startOver: () => Promise<void>
  readonly retrySave: () => void
}

export type AppStore = ReturnType<typeof createAppStore>

export function createAppStore(repository: Repository, now: () => Date = () => new Date()) {
  return createStore<AppState>()((set, get) => {
    /** Lo que depende de la hora, leído en un mismo instante. */
    const clock = () => {
      const instant = now()
      return { today: toDayKey(instant), creditedThrough: creditedThrough(instant) }
    }

    const persist = (data: AppData) => {
      repository.save(data).then(
        () => {
          set({ saveFailed: false })
        },
        () => {
          set({ saveFailed: true })
        },
      )
    }

    const commit = (data: AppData) => {
      set({ data })
      persist(data)
    }

    const open = (loaded: AppData) => {
      const time = clock()
      const data = reconcile(loaded, time.today)
      set({ ...time, status: 'ready', data, saveFailed: false })
      if (data !== loaded) persist(data)
    }

    const refreshDay = () => {
      if (get().status !== 'ready') return
      const time = clock()
      const previous = get().data
      const data = reconcile(previous, time.today)
      // Día y datos cambian a la vez: nunca se ve un día sin su registro.
      set({ ...time, data })
      if (data !== previous) persist(data)
    }

    const apply = (action: (data: AppData, today: DayKey) => ActionResult): GoalError | null => {
      if (get().status !== 'ready') return null
      refreshDay()
      const result = action(get().data, get().today)
      if (!result.ok) return result.error
      commit(result.data)
      return null
    }

    return {
      status: 'loading',
      data: createEmptyData(),
      ...clock(),
      saveFailed: false,

      async load() {
        set({ status: 'loading' })
        let result: LoadResult
        try {
          result = await repository.load()
        } catch {
          set({ status: 'load-error' })
          return
        }
        if (result.status === 'ready') open(result.data)
        else set({ status: result.status })
      },

      refreshDay,

      toggle(id) {
        if (get().status !== 'ready') return
        const shown = get().today
        refreshDay()
        // Pasada la medianoche, la pantalla cambia antes de dar nada por hecho.
        if (get().today !== shown) return
        apply((data, today) => toggleGoal(data, today, id))
      },

      addGoal: (draft) => apply((data, today) => addGoal(data, today, draft)),
      updateGoal: (id, draft) => apply((data, today) => updateGoal(data, today, id, draft)),
      removeGoal: (id) => apply((data, today) => removeGoal(data, today, id)),

      async startOver() {
        let data: AppData
        try {
          data = await repository.startOver()
        } catch {
          set({ saveFailed: true })
          return
        }
        open(data)
      },

      retrySave() {
        persist(get().data)
      },
    }
  })
}
