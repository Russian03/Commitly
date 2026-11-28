import { render } from '@testing-library/react'
import { domMax, LazyMotion } from 'motion/react'
import { describe, expect, it } from 'vitest'
import { Medal } from './Medal'

function ring(done: number, total: number) {
  const { container } = render(
    <LazyMotion features={domMax} strict>
      <Medal level={0} perfect={done === total && total > 0} done={done} total={total} />
    </LazyMotion>,
  )
  const paths = (name: string) =>
    [...container.querySelectorAll(`path[class*="${name}"]`)].map((path) => {
      const numbers = (path.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
      const [startX = 0, startY = 0] = numbers
      const [endX = 0, endY = 0] = numbers.slice(-2)
      return { startX, startY, endX, endY }
    })
  return { track: paths('track'), fill: paths('fill') }
}

const CENTER = 110

describe('anillo de la medalla', () => {
  it.each([
    [0, 0, 1],
    [0, 1, 1],
    [1, 5, 5],
    [3, 12, 12],
  ])('con %i de %i metas dibuja %i tramos', (done, total, segments) => {
    const { track, fill } = ring(done, total)

    expect(track).toHaveLength(segments)
    expect(fill).toHaveLength(done)
  })

  it('con dos metas, la primera cumplida llena la mitad izquierda', () => {
    const [first] = ring(1, 2).fill

    expect(first?.startX).toBeLessThan(CENTER)
    expect(first?.endX).toBeLessThan(CENTER)
    // De abajo hacia arriba.
    expect(first?.startY).toBeGreaterThan(CENTER)
    expect(first?.endY).toBeLessThan(CENTER)
  })

  it('llena los tramos en orden, de la izquierda a la derecha', () => {
    const { fill } = ring(5, 5)
    const middles = fill.map(({ startX, endX }) => (startX + endX) / 2)

    expect(middles[0]).toBeLessThan(CENTER)
    expect(middles[1]).toBeLessThan(CENTER)
    expect(middles[2]).toBeCloseTo(CENTER, 0)
    expect(middles[3]).toBeGreaterThan(CENTER)
    expect(middles[4]).toBeGreaterThan(CENTER)
  })
})
