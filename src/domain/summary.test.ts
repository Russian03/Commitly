import { describe, expect, it } from 'vitest'
import { summarizeDay } from './summary'
import { record } from './testing'

describe('summarizeDay', () => {
  it('resume un día perfecto', () => {
    expect(summarizeDay(record(['g1', 'g2'], ['g1', 'g2']))).toEqual({
      total: 2,
      done: 2,
      level: 1,
      points: 30,
      perfect: true,
      rest: false,
    })
  })

  it('un día sin metas es libre, no perfecto', () => {
    expect(summarizeDay(record([]))).toEqual({
      total: 0,
      done: 0,
      level: 0,
      points: 0,
      perfect: false,
      rest: true,
    })
  })
})
