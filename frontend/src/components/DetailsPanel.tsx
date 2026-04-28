import { useMemo, useState } from 'react'
import { useChatsStore } from '../store/chatsStore'
import { Avatar } from './Avatar'
import { Icon } from './chatIcons'
import ImageLightbox from './ImageLightbox'
import type { Chat } from '../types'
import styles from './DetailsPanel.module.css'

interface Props {
  chat: Chat
  onClose: () => void
}

interface MediaItem {
  url: string
  fileName: string
  fileSize?: number
}

export default function DetailsPanel({ chat, onClose }: Props) {
  const messages = useChatsStore(s => s.messages)
  const [lightbox, setLightbox] = useState<MediaItem | null>(null)

  const mediaItems = useMemo<MediaItem[]>(() => {
    const list = messages[chat.id] ?? []
    return list.flatMap(m =>
      m.payload.type === 'image'
        ? [{ url: m.payload.url, fileName: m.payload.fileName, fileSize: m.payload.fileSize }]
        : []
    )
  }, [chat, messages])

  const title = chat.type === 'Group' ? (chat.name ?? 'Группа') : (chat.otherUserName ?? 'Личное')
  const subtitle = chat.type === 'Group' ? 'Группа' : 'Личный чат'

  const recentMedia = mediaItems.slice(-6).reverse()

  return (
    <aside className={styles.panel}>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Закрыть панель"
        title="Закрыть"
      >
        <Icon.Close size={18} />
      </button>
      <div className={styles.scroll}>
        <div className={styles.header}>
          <Avatar name={title} size={88} />
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.actionPill}>
            <Icon.Bell size={16} />
            <span>Звук</span>
          </button>
          <button className={styles.actionPill}>
            <Icon.Search size={16} />
            <span>Поиск</span>
          </button>
          <button className={styles.actionPill}>
            <Icon.More size={16} />
            <span>Ещё</span>
          </button>
        </div>

        <ul className={styles.settingsList}>
          <li>
            <button className={styles.settingsRow}>
              <span className={styles.settingsIcon}><Icon.Bell size={16} /></span>
              <span className={styles.settingsLabel}>Уведомления</span>
              <span className={styles.settingsValue}>Вкл.</span>
              <Icon.ChevronRight size={14} />
            </button>
          </li>
          <li>
            <button className={styles.settingsRow}>
              <span className={styles.settingsIcon}><Icon.Lock size={16} /></span>
              <span className={styles.settingsLabel}>Конфиденциальность</span>
              <Icon.ChevronRight size={14} />
            </button>
          </li>
          <li>
            <button className={styles.settingsRow}>
              <span className={styles.settingsIcon}><Icon.File size={16} /></span>
              <span className={styles.settingsLabel}>Файлы</span>
              <Icon.ChevronRight size={14} />
            </button>
          </li>
          <li>
            <button className={`${styles.settingsRow} ${styles.settingsDanger}`}>
              <span className={styles.settingsIcon}><Icon.Trash size={16} /></span>
              <span className={styles.settingsLabel}>Очистить историю</span>
            </button>
          </li>
        </ul>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Медиа</h3>
            {recentMedia.length > 0 && (
              <span className={styles.sectionCount}>{mediaItems.length}</span>
            )}
          </div>

          {recentMedia.length === 0 ? (
            <p className={styles.mediaEmpty}>Пока нет медиафайлов</p>
          ) : (
            <div className={styles.mediaGrid}>
              {recentMedia.map((m, i) => (
                <button
                  key={`${m.url}-${i}`}
                  className={styles.mediaItem}
                  onClick={() => setLightbox(m)}
                  aria-label={m.fileName}
                >
                  <img src={m.url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <ImageLightbox
          url={lightbox.url}
          fileName={lightbox.fileName}
          fileSize={lightbox.fileSize}
          onClose={() => setLightbox(null)}
        />
      )}
    </aside>
  )
}
