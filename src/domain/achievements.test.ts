import { describe, expect, it } from 'vitest'
import { ACHIEVEMENT_DAYS, achievements, achievementPoints, nextAchievement } from './achievements'

describe('achievements', () => {
  it('los escalones son 10, 25, 50, 100, 200 y 365 días', () => {
    expect(ACHIEVEMENT_DAYS).toEqual([10, 25, 50, 100, 200, 365])
  })

  it('marca los conseguidos y su premio', () => {
    expect(achievements(25, 10).slice(0, 3)).toEqual([
      { days: 10, reward: 100, unlocked: true },
      { days: 25, reward: 250, unlocked: true },
      { days: 50, reward: 500, unlocked: false },
    ])
  })

  it.each([
    [9, 10, 0],
    [10, 10, 100],
    [24, 10, 100],
    [50, 20, 1700],
    [365, 10, 7500],
  ])('con %i días a %i por día se han ganado %i puntos', (reached, perDay, points) => {
    expect(achievementPoints(reached, perDay)).toBe(points)
  })

  it('señala el siguiente por conseguir', () => {
    expect(nextAchievement(achievements(12, 20))).toEqual({
      days: 25,
      reward: 500,
      unlocked: false,
    })
  })

  it('no queda ninguno al completarlos todos', () => {
    expect(nextAchievement(achievements(400, 10))).toBeNull()
  })
})
