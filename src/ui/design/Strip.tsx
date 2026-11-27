import { CaretDownIcon } from '@phosphor-icons/react/CaretDown'
import type { ReactNode } from 'react'
import { useId, useState } from 'react'
import { ProgressBar } from './ProgressBar'
import styles from './Strip.module.css'

interface Props {
  /** Nivel del título dentro de la pantalla. */
  readonly heading: 'h2' | 'h3'
  /** Dibujo o icono del cuadro de la izquierda. */
  readonly lead: ReactNode
  readonly title: string
  /** Líneas pequeñas bajo el título. */
  readonly details: readonly string[]
  readonly progress?: { readonly value: number; readonly max: number; readonly label?: string }
}

/** Una fila a todo lo ancho sobre menta. */
export function Strip({ heading: Heading, lead, title, details, progress }: Props) {
  return (
    <div className={styles.strip} data-strip>
      <div className={styles.row}>
        <span className={styles.lead}>{lead}</span>
        <div className={styles.body}>
          <Heading className={styles.title}>{title}</Heading>
          {progress ? <ProgressBar {...progress} /> : null}
          {details.map((line) => (
            <p key={line} className={styles.detail}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Una tira que al tocarla enseña más debajo. */
export function ExpandableStrip({
  heading: Heading,
  lead,
  title,
  details,
  progress,
  children,
}: Props & { readonly children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <div className={styles.strip} data-strip>
      <Heading className={styles.heading}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => {
            setOpen(!open)
          }}
        >
          {/* Dentro de un botón solo puede haber elementos de texto. */}
          <span className={styles.lead}>{lead}</span>
          <span className={styles.body}>
            <span className={styles.title}>{title}</span>{' '}
            {progress ? <ProgressBar {...progress} /> : null}
            {details.map((line) => (
              <span key={line} className={styles.detail}>
                {line}{' '}
              </span>
            ))}
          </span>
          <CaretDownIcon className={styles.caret} size={20} aria-hidden />
        </button>
      </Heading>
      <div id={id} className={styles.panel} hidden={!open}>
        {open ? children : null}
      </div>
    </div>
  )
}
