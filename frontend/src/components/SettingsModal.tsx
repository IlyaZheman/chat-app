import { useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import {
  notificationsPermission,
  notificationsSupported,
  requestNotificationsPermission,
} from '../utils/notifications'
import { Icon } from './chatIcons'
import styles from './SettingsModal.module.css'

interface Props {
  onClose: () => void
}

export default function SettingsModal({ onClose }: Props) {
  const { soundEnabled, setSoundEnabled } = useSettingsStore()
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(
    () => notificationsPermission()
  )

  const handleEnableNotifications = async () => {
    const result = await requestNotificationsPermission()
    setNotifPermission(result)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Настройки</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <Icon.Close size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.sectionTitle}>Уведомления</p>

          {notificationsSupported() && (
            <div className={styles.row}>
              <div className={styles.rowInfo}>
                <span className={styles.rowLabel}>Push-уведомления</span>
                <span className={styles.rowSub}>
                  {notifPermission === 'granted'
                    ? 'Включены'
                    : notifPermission === 'denied'
                      ? 'Заблокированы в браузере'
                      : 'Выключены'}
                </span>
              </div>
              {notifPermission === 'default' && (
                <button className={styles.enableBtn} onClick={handleEnableNotifications}>
                  Включить
                </button>
              )}
              {notifPermission === 'granted' && (
                <span className={styles.statusOk}><Icon.Bell size={15} /></span>
              )}
              {notifPermission === 'denied' && (
                <span className={styles.statusOff}><Icon.BellOff size={15} /></span>
              )}
            </div>
          )}

          <div className={styles.row}>
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>Звук сообщений</span>
              <span className={styles.rowSub}>Звуковой сигнал при новых сообщениях</span>
            </div>
            <button
              className={`${styles.toggle} ${soundEnabled ? styles.toggleOn : ''}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label={soundEnabled ? 'Выключить звук' : 'Включить звук'}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
