import { useToastStore } from '../store/toastStore'
import styles from './Toast.module.css'

export default function Toast() {
  const { toasts, dismiss } = useToastStore()
  if (toasts.length === 0) return null

  return (
    <div className={styles.container} role="region" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={styles.toast} onClick={() => dismiss(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
