import { useCallback, useState } from 'react'

export interface Size {
  readonly width: number
  readonly height: number
}

/** El tamaño del contenido de un elemento, al día cuando cambia. `null` hasta medirlo. */
export function useElementSize() {
  const [size, setSize] = useState<Size | null>(null)
  const ref = useCallback((element: HTMLElement | null) => {
    if (!element) return undefined
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])
  return [ref, size] as const
}
