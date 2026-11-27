import { useTranslation } from 'react-i18next'
import { useApp } from '../state/context'
import styles from './SaveBanner.module.css'

export function SaveBanner() {
  const { t } = useTranslation()
  const failed = useApp((state) => state.saveFailed)
  const retry = useApp((state) => state.retrySave)

  if (!failed) return null

  return (
    <div className={styles.banner} role="alert">
      <span>{t('status.saveFailed')}</span>
      <button type="button" className={styles.retry} onClick={retry}>
        {t('status.retry')}
      </button>
    </div>
  )
}
