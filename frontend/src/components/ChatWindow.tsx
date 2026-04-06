import { useEffect, useRef } from 'react'
import { useChatsStore } from '../store/chatsStore'
import { useAuthStore } from '../store/authStore'
import MessageInput from './MessageInput'
import type { Chat } from '../types'
import styles from './ChatWindow.module.css'

interface Props {
  chat: Chat
}

export default function ChatWindow({ chat }: Props) {
  const auth = useAuthStore(s => s.auth)
  const { messages, sendMessage } = useChatsStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  const chatMessages = messages[chat.id] ?? []

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages.length])

  const getChatTitle = () => {
    if (chat.type === 'Group') return chat.name ?? 'Группа'
    return 'Личное сообщение'
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('ru', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={styles.window}>
      {/* Chat header */}
      <div className={styles.header}>
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
          const isOwn = msg.senderId === auth?.userName || msg.senderId === auth?.userId
          const isSystem = msg.senderId === 'System'
          const prevMsg = chatMessages[i - 1]
          const isContinuation = prevMsg && prevMsg.senderId === msg.senderId

          if (isSystem) {
            return (
              <div key={msg.id} className={styles.systemMsg}>
                {msg.text}
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={`${styles.msgRow} ${isOwn ? styles.own : ''} ${isContinuation ? styles.continuation : ''}`}
            >
              {!isOwn && !isContinuation && (
                <span className={styles.senderName}>{msg.senderId}</span>
              )}
              <div className={styles.bubble}>
                <span className={styles.bubbleText}>{msg.text}</span>
                <span className={styles.bubbleTime}>{formatTime(msg.sentAt)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={sendMessage} />
    </div>
  )
}