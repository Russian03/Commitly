import { BlurIn } from '../reactbits/BlurIn'
import styles from './Text.module.css'

interface Props {
  /** Primera palabra, en cursiva. */
  readonly lead: string
  readonly first: string
  readonly second: string
  /** Entrada animada, solo al abrir la app. */
  readonly play: boolean
}

export function Headline({ lead, first, second, play }: Props) {
  return (
    <h1 className={styles.headline}>
      <BlurIn play={play} order={0}>
        <em>{lead}</em>
      </BlurIn>{' '}
      <BlurIn play={play} order={1}>
        {first}
        {/* Adorno: no se lee en voz alta. */}
        <sup className={styles.mark} aria-hidden="true">
          ®
        </sup>
      </BlurIn>{' '}
      <br />
      <BlurIn play={play} order={2}>
        {second}
      </BlurIn>
    </h1>
  )
}
