import { useState } from 'react'
import { useChatsStore } from '../store/chatsStore'
import { useAuthStore } from '../store/authStore'
import type { Chat } from '../types'
import { ChatIcons } from './chatIcons'
import NewGroupView from './NewGroupView'
import NewPrivateView from './NewPrivateView'
import BrowseGroupsView from './BrowseGroupsView'
import styles from './ChatList.module.css'

interface Props {
  onLogout: () => void
  onChatOpen?: () => void
}

type View = 'list' | 'newGroup' | 'newPrivate' | 'browseGroups'

export default function ChatList({ onLogout, onChatOpen }: Props) {
  const auth = useAuthStore(s => s.auth)
  const { chats, activeChatId, selectChat } = useChatsStore()

  const [showMenu, setShowMenu] = useState(false)
  const [view, setView] = useState<View>('list')

  const goBack = () => setView('list')

  const openChat = async (chatId: string) => {
    setView('list')
    await selectChat(chatId)
    onChatOpen?.()
  }

  if (view === 'newGroup') {
    return <NewGroupView onBack={goBack} onCreated={openChat} />
  }
  if (view === 'browseGroups') {
    return <BrowseGroupsView onBack={goBack} onJoined={openChat} />
  }
  if (view === 'newPrivate') {
    return <NewPrivateView onBack={goBack} onCreated={openChat} />
  }

  const getChatLabel = (chat: Chat) => {
    if (chat.type === 'Group') return chat.name ?? 'Группа'
    return chat.otherUserName ?? 'Личное'
  }

  const getChatIcon = (chat: Chat) =>
    chat.type === 'Group' ? ChatIcons.group : ChatIcons.private

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>{ChatIcons.brand}</span>
          <span className={styles.brandName}>Chat</span>
        </div>
        <div className={styles.userRow}>
          <span className={styles.userName}>{auth?.userName}</span>
          <button className={styles.logoutBtn} onClick={onLogout} title="Выйти">⎋</button>
        </div>
      </div>

      <nav className={styles.list}>
        {chats.length === 0 && (
          <p className={styles.empty}>Нет чатов. Создайте первый!</p>
        )}
        {chats.map(chat => (
          <button
            key={chat.id}
            className={`${styles.chatItem} ${activeChatId === chat.id ? styles.active : ''}`}
            onClick={() => {
              selectChat(chat.id)
              onChatOpen?.()
            }}
          >
            <span className={styles.chatIcon}>{getChatIcon(chat)}</span>
            <span className={styles.chatLabel}>{getChatLabel(chat)}</span>
            {chat.type === 'Group' && (
              <span className={styles.chatBadge}>group</span>
            )}
          </button>
        ))}
      </nav>

      {showMenu && (
        <div className={styles.backdrop} onClick={() => setShowMenu(false)} />
      )}

      {showMenu && (
        <div className={styles.fabMenu}>
          <button
            className={styles.fabMenuItem}
            onClick={() => { setShowMenu(false); setView('newGroup') }}
          >
            <span>{ChatIcons.group}</span> Группа
          </button>
          <button
            className={styles.fabMenuItem}
            onClick={() => { setShowMenu(false); setView('newPrivate') }}
          >
            <span>{ChatIcons.private}</span> Личное
          </button>
          <button
            className={styles.fabMenuItem}
            onClick={() => { setShowMenu(false); setView('browseGroups') }}
          >
            <span>{ChatIcons.group}</span> Найти группу
          </button>
        </div>
      )}

      <button
        className={`${styles.fab} ${showMenu ? styles.fabOpen : ''}`}
        onClick={() => setShowMenu(v => !v)}
        title="Создать чат"
      >
        +
      </button>
    </aside>
  )
}
