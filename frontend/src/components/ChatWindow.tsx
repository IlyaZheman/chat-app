import { useEffect, useRef, useState } from 'react'
import { useChatsStore } from '../store/chatsStore'
import { useAuthStore } from '../store/authStore'
import MessageInput from './MessageInput'
import MessageContent from './MessageContent'
import ImageLightbox from './ImageLightbox'
import { Avatar } from './Avatar'
import { Icon } from './chatIcons'
import type { Chat } from '../types'
import styles from './ChatWindow.module.css'

interface Props {
  chat: Chat
  onBack: () => void
  onToggleDetails: () => void
  detailsOpen: boolean
}

interface LightboxImage {
  url: string
  fileName: string
  fileSize?: number
}

export default function ChatWindow({ chat, onBack, onToggleDetails, detailsOpen }: Props) {
  const auth = useAuthStore(s => s.auth)
  const { messages, sendMessage } = useChatsStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null)

  const chatMessages = messages[chat.id] ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages.length])

  const getChatTitle = () => {
    if (chat.type === 'Group') return chat.name ?? 'Группа'
    return chat.otherUserName ?? 'Личное сообщение'
  }

  const subtitle = chat.type === 'Group' ? 'Группа' : 'В сети'

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })

  const title = getChatTitle()

  return (
    <div className={styles.window}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Назад">
          <Icon.ArrowLeft size={18} />
        </button>
        <button
          type="button"
          className={styles.headerInfo}
          onClick={onToggleDetails}
          aria-label={detailsOpen ? 'Скрыть детали чата' : 'Показать детали чата'}
          aria-expanded={detailsOpen}
        >
          <Avatar name={title} size={40} />
          <div className={styles.chatInfo}>
            <h2 className={styles.chatTitle}>{title}</h2>
            <p className={styles.chatMeta}>{subtitle}</p>
          </div>
        </button>
        <div className={styles.headerActions}>
          <button className={styles.headerBtn} title="Звонок" aria-label="Звонок">
            <Icon.Phone size={18} />
          </button>
          <button className={styles.headerBtn} title="Видео" aria-label="Видео">
            <Icon.Video size={18} />
          </button>
          <button className={styles.headerBtn} title="Ещё" aria-label="Ещё">
            <Icon.More size={18} />
          </button>
        </div>
      </div>

      <div className={styles.messages}>
        {chatMessages.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyBadge}><Icon.Brand size={26} /></div>
            <p className={styles.emptyTitle}>Начните беседу</p>
            <p className={styles.emptySubtitle}>Напишите первое сообщение — оно появится здесь.</p>
          </div>
        )}

        {chatMessages.map((msg, i) => {
          const isOwn = msg.senderName === auth?.userName
          const isSystem = msg.senderName === 'System'
          const prevMsg = chatMessages[i - 1]
          const isContinuation = prevMsg && prevMsg.senderName === msg.senderName

          if (isSystem) {
            return (
              <div key={msg.id} className={styles.systemMsg}>
                {msg.payload.type === 'text' ? msg.payload.text : ''}
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={`${styles.msgRow} ${isOwn ? styles.own : ''} ${isContinuation ? styles.continuation : ''}`}
            >
              {!isOwn && !isContinuation && chat.type === 'Group' && (
                <span className={styles.senderName}>{msg.senderName}</span>
              )}
              <div className={styles.bubble}>
                <MessageContent payload={msg.payload} onOpenImage={setLightbox} />
                <span className={styles.bubbleTime}>{formatTime(msg.sentAt)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={sendMessage} />
      {lightbox && (
        <ImageLightbox
          url={lightbox.url}
          fileName={lightbox.fileName}
          fileSize={lightbox.fileSize}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
