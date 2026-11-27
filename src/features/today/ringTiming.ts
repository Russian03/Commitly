/** Lo que tarda en llenarse cada tramo del anillo. */
export const STEP_SECONDS = 0.25

/** Lo que tarda el anillo en llenar `done` tramos, uno detrás de otro. */
export function ringSeconds(done: number): number {
  return done * STEP_SECONDS
}
