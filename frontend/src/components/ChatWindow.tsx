import { useEffect, useRef, useState } from 'react'
import { useChatsStore } from '../store/chatsStore'
import { useAuthStore } from '../store/authStore'
import MessageInput from './MessageInput'
import ImageLightbox from './ImageLightbox'
import FileCard from './FileCard'
import type { Chat, MessagePayload } from '../types'
import styles from './ChatWindow.module.css'

interface Props {
  chat: Chat
  onBack: () => void
}

export default function ChatWindow({ chat, onBack }: Props) {
  const auth = useAuthStore(s => s.auth)
  const { messages, sendMessage } = useChatsStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [lightbox, setLightbox] = useState<{ url: string; fileName: string; fileSize?: number } | null>(null)

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

  const renderPayload = (payload: MessagePayload) => {
    switch (payload.type) {
      case 'text':
        return <span className={styles.bubbleText}>{payload.text}</span>
      case 'image':
        return (
          <>
            {payload.captionPosition === 'above' && payload.caption && (
              <span className={styles.bubbleText}>{payload.caption}</span>
            )}
            <button
              className={styles.imageBtn}
              onClick={() => setLightbox({ url: payload.url, fileName: payload.fileName, fileSize: payload.fileSize })}
              aria-label="Открыть изображение"
            >
              <img
                src={payload.url}
                alt={payload.fileName}
                className={styles.attachmentImage}
                loading="lazy"
              />
            </button>
            {payload.captionPosition !== 'above' && payload.caption && (
              <span className={styles.bubbleCaption}>{payload.caption}</span>
            )}
          </>
        )
      case 'file':
        if (payload.mediaType.startsWith('video/')) {
          return (
            <video
              src={payload.url}
              controls
              className={styles.attachmentVideo}
            />
          )
        }
        if (payload.mediaType.startsWith('audio/')) {
          return (
            <audio
              src={payload.url}
              controls
              className={styles.attachmentAudio}
            />
          )
        }
        return (
          <FileCard
            url={payload.url}
            fileName={payload.fileName}
            mediaType={payload.mediaType}
            fileSize={payload.fileSize}
          />
        )
    }
  }

  return (
    <div className={styles.window}>
      {/* Chat header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Назад">←</button>
        <div className={styles.chatInfo}>
          <span className={styles.chatIcon}>
            {chat.type === 'Group' ? '⬡' : '◎'}
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

      {/* Messages */}
      <div className={styles.messages}>
        {chatMessages.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>◈</span>
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
                {renderPayload(msg.payload)}
                <span className={styles.bubbleTime}>{formatTime(msg.sentAt)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
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