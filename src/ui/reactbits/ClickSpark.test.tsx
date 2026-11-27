import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClickSpark } from './ClickSpark'

const context = {
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
}
let frames: FrameRequestCallback[] = []

const canvases = () => document.querySelectorAll('canvas')

const nextFrame = (time: number) => {
  const pending = frames
  frames = []
  for (const frame of pending) frame(time)
}

const renderSpark = (active = true) =>
  render(
    <ClickSpark active={active}>
      <button type="button">Marcar</button>
    </ClickSpark>,
  )

beforeEach(() => {
  frames = []
  vi.spyOn(performance, 'now').mockReturnValue(1000)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  )
  vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => frames.push(frame))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  context.stroke.mockClear()
})

describe('ClickSpark', () => {
  it('lanza chispas al tocar y las retira al terminar', async () => {
    renderSpark()

    await userEvent.click(screen.getByRole('button'))
    expect(canvases()).toHaveLength(1)
    expect(canvases()[0]).toHaveAttribute('aria-hidden', 'true')

    nextFrame(1100)
    expect(context.stroke).toHaveBeenCalledTimes(8)

    nextFrame(2000)
    expect(canvases()).toHaveLength(0)
    expect(frames).toHaveLength(0)
  })

  it('con el teclado salen del centro', async () => {
    renderSpark()
    screen.getByRole('button').focus()

    await userEvent.keyboard('{Enter}')

    expect(canvases()).toHaveLength(1)
  })

  it('no hace nada si está inactivo', async () => {
    renderSpark(false)

    await userEvent.click(screen.getByRole('button'))

    expect(canvases()).toHaveLength(0)
  })

  it('respeta que el móvil pida reducir el movimiento', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    renderSpark()

    await userEvent.click(screen.getByRole('button'))

    expect(canvases()).toHaveLength(0)
  })

  it('no falla si no se puede dibujar', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    renderSpark()

    await userEvent.click(screen.getByRole('button'))

    expect(canvases()).toHaveLength(0)
  })

  it('al desmontarse detiene las animaciones en curso', async () => {
    const { unmount } = renderSpark()
    await userEvent.click(screen.getByRole('button'))

    unmount()

    expect(cancelAnimationFrame).toHaveBeenCalled()
    expect(canvases()).toHaveLength(0)
  })
})
