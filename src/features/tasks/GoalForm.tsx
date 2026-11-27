import { ArrowLeftIcon } from '@phosphor-icons/react/ArrowLeft'
import type { ReactNode, SyntheticEvent } from 'react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigator } from '../../app/navigator'
import type { Weekday } from '../../domain/date'
import type { GoalContent, GoalDraft, GoalError } from '../../domain/goal'
import { Button } from '../../ui/design/Button'
import { IconButton } from '../../ui/design/IconButton'
import { Screen } from '../../ui/design/Screen'
import { ScreenTitle } from '../../ui/design/Titles'
import styles from './GoalForm.module.css'
import { goalName } from './goalText'
import { illustrationFor } from './illustrations'
import { WeekdayPicker } from './WeekdayPicker'

interface Props {
  readonly heading: string
  readonly submitLabel: string
  readonly content: GoalContent
  readonly weekdays: readonly Weekday[]
  /** Devuelve el motivo del rechazo, o `null` si se ha guardado. */
  readonly onSubmit: (draft: GoalDraft) => GoalError | null
  /** Acciones bajo el botón principal. */
  readonly children?: ReactNode
}

export function GoalForm({ heading, submitLabel, content, onSubmit, children, ...props }: Props) {
  const { t } = useTranslation()
  const navigator = useNavigator()
  const [title, setTitle] = useState(content.kind === 'custom' ? content.title : '')
  const [weekdays, setWeekdays] = useState(props.weekdays)
  const [error, setError] = useState<GoalError | null>(null)
  const id = useId()
  const errorId = `${id}-error`
  const titleInvalid =
    error === 'title-empty' || error === 'title-too-long' || error === 'duplicate'

  const submit = (event: SyntheticEvent) => {
    event.preventDefault()
    const draft: GoalDraft = {
      content: content.kind === 'custom' ? { kind: 'custom', title } : content,
      weekdays,
    }
    const rejected = onSubmit(draft)
    if (rejected) setError(rejected)
    else navigator.close()
  }

  return (
    <Screen
      action={<IconButton label={t('form.back')} icon={ArrowLeftIcon} onClick={navigator.back} />}
    >
      <ScreenTitle focusOnMount>{heading}</ScreenTitle>
      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.art}>
          <img src={illustrationFor(content)} alt="" />
        </div>
        {content.kind === 'custom' ? (
          <label className={styles.name}>
            <span>{t('form.name')}</span>
            <input
              type="text"
              value={title}
              placeholder={t('form.namePlaceholder')}
              autoComplete="off"
              enterKeyHint="done"
              aria-invalid={titleInvalid}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => {
                setTitle(event.target.value)
                setError(null)
              }}
            />
          </label>
        ) : (
          <p className={styles.preset}>{goalName(content, t)}</p>
        )}
        <WeekdayPicker
          selected={weekdays}
          onChange={(selected) => {
            setWeekdays(selected)
            setError(null)
          }}
        />
        {error ? (
          <p id={errorId} className={styles.error} role="alert">
            {t(`form.errors.${error}`)}
          </p>
        ) : null}
        <Button type="submit">{submitLabel}</Button>
      </form>
      {children}
    </Screen>
  )
}
