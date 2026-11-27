import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { minimizeApp, onBackButton } from '../platform/lifecycle'
import { useApp } from '../state/context'
import { Button } from '../ui/design/Button'
import { Confirm } from '../ui/design/Confirm'
import { Logo } from '../ui/design/Logo'
import { ScreenTitle } from '../ui/design/Titles'
import styles from './StatusScreen.module.css'

/** Lo que se ve mientras no hay datos que mostrar. Nunca se sobrescribe nada sin pedirlo. */
export function StatusScreen() {
  const { t } = useTranslation()
  const status = useApp((state) => state.status)
  const saveFailed = useApp((state) => state.saveFailed)
  const load = useApp((state) => state.load)
  const startOver = useApp((state) => state.startOver)
  const [confirming, setConfirming] = useState(false)

  // Con el plugin instalado, «atrás» no hace nada si nadie lo escucha.
  useEffect(() => onBackButton(minimizeApp), [])

  if (status === 'loading') {
    return (
      <main className={styles.screen} aria-busy="true" aria-label={t('status.loading')}>
        <Logo />
      </main>
    )
  }

  return (
    <main className={styles.screen}>
      <Logo />
      {status === 'corrupt' ? (
        <>
          <ScreenTitle>{t('status.corruptTitle')}</ScreenTitle>
          <p>{t('status.corrupt')}</p>
          {confirming ? (
            <Confirm
              question={t('status.startOverQuestion')}
              confirmLabel={t('status.startOverConfirm')}
              cancelLabel={t('form.cancel')}
              onConfirm={() => void startOver()}
              onCancel={() => {
                setConfirming(false)
              }}
            />
          ) : (
            <Button
              onClick={() => {
                setConfirming(true)
              }}
            >
              {t('status.startOver')}
            </Button>
          )}
          {saveFailed ? <p role="alert">{t('status.saveFailed')}</p> : null}
        </>
      ) : null}
      {status === 'unsupported' ? (
        <>
          <ScreenTitle>{t('status.unsupportedTitle')}</ScreenTitle>
          <p>{t('status.unsupported')}</p>
        </>
      ) : null}
      {status === 'load-error' ? (
        <>
          <ScreenTitle>{t('status.loadErrorTitle')}</ScreenTitle>
          <p>{t('status.loadError')}</p>
          <Button onClick={() => void load()}>{t('status.retry')}</Button>
        </>
      ) : null}
    </main>
  )
}
