import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom no dibuja en lienzos y lo avisa en cada intento. Algunas pruebas corren sin DOM.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null
}

// jsdom no maqueta: cada elemento observado dice medir el hueco de un móvil de 393 px.
if (typeof window !== 'undefined') {
  window.ResizeObserver = class implements ResizeObserver {
    constructor(private readonly notify: ResizeObserverCallback) {}

    observe(target: Element) {
      const contentRect = { width: 361, height: 500 } as DOMRectReadOnly
      this.notify([{ target, contentRect } as ResizeObserverEntry], this)
    }

    unobserve() {
      return undefined
    }

    disconnect() {
      return undefined
    }
  }
}

afterEach(cleanup)
