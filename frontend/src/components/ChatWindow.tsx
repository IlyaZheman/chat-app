import { useEffect, useRef, useState } from 'react'
import { useChatsStore } from '../store/chatsStore'
import { useAuthStore } from '../store/authStore'
import MessageInput from './MessageInput'
import MessageContent from './MessageContent'
import ImageLightbox from './ImageLightbox'
import type { Chat } from '../types'
import { ChatIcons } from './chatIcons'
import styles from './ChatWindow.module.css'

interface Props {
  chat: Chat
  onBack: () => void
}

interface LightboxImage {
  url: string
  fileName: string
  fileSize?: number
}

export default function ChatWindow({ chat, onBack }: Props) {
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

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={styles.window}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Назад">←</button>
        <div className={styles.chatInfo}>
          <span className={styles.chatIcon}>
            {chat.type === 'Group' ? ChatIcons.group : ChatIcons.private}
          </span>
          <div>
            <h2 className={styles.chatTitle}>{getChatTitle()}</h2>
            <p className={styles.chatMeta}>
              {chat.type === 'Group' ? 'Группа' : 'Личный чат'}
              {' · '}
              <span className={styles.chatId}>{chat.id.slice(0, 8)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className={styles.messages}>
        {chatMessages.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>{ChatIcons.brand}</span>
            <p>Сообщений пока нет.</p>
            <p>Напишите первым!</p>
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
              {!isOwn && !isContinuation && (
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
