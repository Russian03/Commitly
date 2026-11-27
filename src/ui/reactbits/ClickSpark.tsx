/*
 * Adaptado de ClickSpark, de React Bits (https://github.com/DavidHDev/react-bits, commit a30a9da).
 * © 2026 David Haz. MIT + Commons Clause: ver docs/licencias/ReactBits-LICENSE.md.
 * Cambios: solo chispas rectas, sin las opciones que la app no usa.
 */
import type { MouseEvent, ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../motion'
import styles from './ClickSpark.module.css'

const COUNT = 8
const DURATION_MS = 450
const RADIUS = 38
const LENGTH = 12
const REACH = RADIUS + LENGTH
const COLOR = '#017a38'

/** Dibuja una ráfaga en su propio lienzo. Devuelve cómo cancelarla. */
function burst(host: HTMLElement, x: number, y: number): (() => void) | null {
  const canvas = document.createElement('canvas')
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = canvas.height = REACH * 2 * ratio
  canvas.className = styles.canvas ?? ''
  canvas.style.left = `${x - REACH}px`
  canvas.style.top = `${y - REACH}px`
  canvas.style.width = canvas.style.height = `${REACH * 2}px`
  canvas.setAttribute('aria-hidden', 'true')
  const context = canvas.getContext('2d')
  if (!context) return null
  host.append(canvas)

  const start = performance.now()
  let frame = 0
  const draw = (now: number) => {
    const progress = Math.max(0, (now - start) / DURATION_MS)
    if (progress >= 1) {
      canvas.remove()
      return
    }
    const distance = RADIUS * (1 - (1 - progress) ** 3)
    const length = LENGTH * (1 - progress)
    context.setTransform(ratio, 0, 0, ratio, REACH * ratio, REACH * ratio)
    context.clearRect(-REACH, -REACH, REACH * 2, REACH * 2)
    context.strokeStyle = COLOR
    context.lineWidth = 2.5
    context.lineCap = 'round'
    for (let index = 0; index < COUNT; index += 1) {
      const angle = (index / COUNT) * Math.PI * 2
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      context.beginPath()
      context.moveTo(cos * distance, sin * distance)
      context.lineTo(cos * (distance + length), sin * (distance + length))
      context.stroke()
    }
    frame = requestAnimationFrame(draw)
  }
  frame = requestAnimationFrame(draw)

  return () => {
    cancelAnimationFrame(frame)
    canvas.remove()
  }
}

interface Props {
  /** Se lee en el momento del toque, antes de que este cambie nada. */
  readonly active: boolean
  readonly children: ReactNode
}

export function ClickSpark({ active, children }: Props) {
  const running = useRef(new Set<() => void>())

  useEffect(() => {
    const bursts = running.current
    return () => {
      for (const cancel of bursts) cancel()
      bursts.clear()
    }
  }, [])

  const spark = (event: MouseEvent<HTMLDivElement>) => {
    if (!active || prefersReducedMotion()) return
    const host = event.currentTarget
    const box = host.getBoundingClientRect()
    // Con teclado o lector de pantalla no hay punto de contacto: salen del centro.
    const fromPointer = event.detail > 0
    const cancel = burst(
      host,
      fromPointer ? event.clientX - box.left : box.width / 2,
      fromPointer ? event.clientY - box.top : box.height / 2,
    )
    if (cancel) running.current.add(cancel)
  }

  return (
    // El teclado ya genera un «click» en el botón que contiene.
    <div className={styles.host} onClickCapture={spark}>
      {children}
    </div>
  )
}
