import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDayWatcher } from './useDayWatcher'

const lifecycle = vi.hoisted(() => ({ resume: (): void => undefined, stop: vi.fn() }))

vi.mock('../platform/lifecycle', () => ({
  onResume: (listener: () => void) => {
    lifecycle.resume = listener
    return lifecycle.stop
  },
}))

const setVisibility = (state: DocumentVisibilityState) => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state)
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 27, 23, 59, 0))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  lifecycle.stop.mockClear()
})

describe('useDayWatcher', () => {
  it('avisa justo después de medianoche, a las 8:00 y otra vez a medianoche', () => {
    const refresh = vi.fn()
    renderHook(() => {
      useDayWatcher(refresh)
    })

    vi.advanceTimersByTime(60_000)
    expect(refresh).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1_000)
    expect(refresh).toHaveBeenCalledTimes(1)

    // De las 00:00:01 a las 08:00:01.
    vi.advanceTimersByTime(8 * 60 * 60 * 1_000 - 1_000)
    expect(refresh).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1_000)
    expect(refresh).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(16 * 60 * 60 * 1_000)
    expect(refresh).toHaveBeenCalledTimes(3)
  })

  it('avisa al volver a verse la app, no al ocultarse', () => {
    const refresh = vi.fn()
    renderHook(() => {
      useDayWatcher(refresh)
    })

    setVisibility('hidden')
    expect(refresh).not.toHaveBeenCalled()
    setVisibility('visible')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('avisa cuando el móvil reanuda la app', () => {
    const refresh = vi.fn()
    renderHook(() => {
      useDayWatcher(refresh)
    })

    lifecycle.resume()

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('al desmontarse deja de escuchar', () => {
    const refresh = vi.fn()
    const { unmount } = renderHook(() => {
      useDayWatcher(refresh)
    })

    unmount()
    setVisibility('visible')
    vi.advanceTimersByTime(24 * 60 * 60 * 1_000)

    expect(refresh).not.toHaveBeenCalled()
    expect(lifecycle.stop).toHaveBeenCalledOnce()
  })
})
