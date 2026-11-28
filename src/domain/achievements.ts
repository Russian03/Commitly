/** Los escalones de todos los logros, en días. */
export const ACHIEVEMENT_DAYS = [10, 25, 50, 100, 200, 365] as const

/** Puntos por cada día del escalón: logros de una meta y logros de días perfectos. */
export const GOAL_REWARD_PER_DAY = 10
export const PERFECT_REWARD_PER_DAY = 20

export interface Achievement {
  /** Días que pide. */
  readonly days: number
  /** Puntos que da al nivel. */
  readonly reward: number
  readonly unlocked: boolean
}

/** Los logros de algo que ha llegado a `reached` días. */
export function achievements(reached: number, rewardPerDay: number): Achievement[] {
  return ACHIEVEMENT_DAYS.map((days) => ({
    days,
    reward: days * rewardPerDay,
    unlocked: reached >= days,
  }))
}

export function achievementPoints(reached: number, rewardPerDay: number): number {
  return achievements(reached, rewardPerDay)
    .filter(({ unlocked }) => unlocked)
    .reduce((sum, { reward }) => sum + reward, 0)
}

export function nextAchievement(list: readonly Achievement[]): Achievement | null {
  return list.find(({ unlocked }) => !unlocked) ?? null
}
