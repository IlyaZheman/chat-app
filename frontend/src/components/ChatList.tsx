import { useState } from 'react'
import { useChatsStore } from '../store/chatsStore'
import { useAuthStore } from '../store/authStore'
import type { Chat } from '../types'
import styles from './ChatList.module.css'

interface Props {
  onLogout: () => void
}

export default function ChatList({ onLogout }: Props) {
  const auth = useAuthStore(s => s.auth)
  const { chats, activeChatId, selectChat, createGroup, openPrivateChat } = useChatsStore()

  const [showNewGroup, setShowNewGroup] = useState(false)
  const [showNewPrivate, setShowNewPrivate] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleGroupCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) return
    setSubmitting(true)
    const chatId = await createGroup(groupName.trim())
    setGroupName('')
    setShowNewGroup(false)
    setSubmitting(false)
    await selectChat(chatId)
  }

  const handlePrivateOpen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetUserId.trim()) return
    setSubmitting(true)
    const chatId = await openPrivateChat(targetUserId.trim())
    setTargetUserId('')
    setShowNewPrivate(false)
    setSubmitting(false)
    await selectChat(chatId)
  }

  const getChatLabel = (chat: Chat) => {
    if (chat.type === 'Group') return chat.name ?? 'Группа'
    return 'Личное'
  }

  const getChatIcon = (chat: Chat) =>
    chat.type === 'Group' ? '⬡' : '◎'

  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>◈</span>
          <span className={styles.brandName}>Chat</span>
        </div>
        <div className={styles.userRow}>
          <span className={styles.userName}>{auth?.userName}</span>
          <button className={styles.logoutBtn} onClick={onLogout} title="Выйти">⎋</button>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          onClick={() => { setShowNewGroup(g => !g); setShowNewPrivate(false) }}
        >
          <span>+</span> Группа
        </button>
        <button
          className={styles.actionBtn}
          onClick={() => { setShowNewPrivate(p => !p); setShowNewGroup(false) }}
        >
          <span>+</span> Личное
        </button>
      </div>

      {/* New group form */}
      {showNewGroup && (
        <form className={styles.newChatForm} onSubmit={handleGroupCreate}>
          <input
            className={styles.newChatInput}
            placeholder="Название группы"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            autoFocus
          />
          <button className={styles.newChatSubmit} disabled={submitting}>
            {submitting ? '...' : 'Создать'}
          </button>
        </form>
      )}

      {/* New private form */}
      {showNewPrivate && (
        <form className={styles.newChatForm} onSubmit={handlePrivateOpen}>
          <input
            className={styles.newChatInput}
            placeholder="ID пользователя"
            value={targetUserId}
            onChange={e => setTargetUserId(e.target.value)}
            autoFocus
          />
          <button className={styles.newChatSubmit} disabled={submitting}>
            {submitting ? '...' : 'Открыть'}
          </button>
        </form>
      )}

      {/* Chat list */}
      <nav className={styles.list}>
        {chats.length === 0 && (
          <p className={styles.empty}>Нет чатов. Создайте первый!</p>
        )}
        {chats.map(chat => (
          <button
            key={chat.id}
            className={`${styles.chatItem} ${activeChatId === chat.id ? styles.active : ''}`}
            onClick={() => selectChat(chat.id)}
          >
            <span className={styles.chatIcon}>{getChatIcon(chat)}</span>
            <span className={styles.chatLabel}>{getChatLabel(chat)}</span>
            {chat.type === 'Group' && (
              <span className={styles.chatBadge}>group</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  )
}
