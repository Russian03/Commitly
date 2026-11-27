/** Registro de ilustraciones: para mejorar un dibujo basta con cambiar su SVG. */
import custom from '../../../design/illustrations/custom.svg'
import exercise from '../../../design/illustrations/exercise.svg'
import meditate from '../../../design/illustrations/meditate.svg'
import read from '../../../design/illustrations/read.svg'
import sleep from '../../../design/illustrations/sleep.svg'
import study from '../../../design/illustrations/study.svg'
import water from '../../../design/illustrations/water.svg'
import type { GoalContent, PresetId } from '../../domain/goal'

const PRESETS: Readonly<Record<PresetId, string>> = {
  read,
  study,
  exercise,
  water,
  meditate,
  sleep,
}

export const CUSTOM_ILLUSTRATION = custom

export function illustrationFor(content: GoalContent): string {
  return content.kind === 'preset' ? PRESETS[content.preset] : custom
}
