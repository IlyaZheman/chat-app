import { useState } from 'react'
import { useChatsStore } from '../store/chatsStore'
import { useAuthStore } from '../store/authStore'
import { usersApi } from '../api/usersApi'
import type { Chat, User } from '../types'
import styles from './ChatList.module.css'

interface Props {
  onLogout: () => void
}

type View = 'list' | 'newGroup' | 'newPrivate' | 'browseGroups'

export default function ChatList({ onLogout }: Props) {
  const auth = useAuthStore(s => s.auth)
  const {
    chats,
    availableGroups,
    activeChatId,
    selectChat,
    createGroup,
    openPrivateChat,
    loadAllGroups,
    joinGroup
  } = useChatsStore()

  const [showMenu, setShowMenu] = useState(false)
  const [view, setView] = useState<View>('list')
  const [groupName, setGroupName] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleGroupCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) return
    setSubmitting(true)
    const chatId = await createGroup(groupName.trim())
    setGroupName('')
    setView('list')
    setSubmitting(false)
    await selectChat(chatId)
  }

  const handleOpenPrivate = async () => {
    setUserSearch('')
    setView('newPrivate')
    const list = await usersApi.getUsers()
    setUsers(list)
  }

  const handleOpenBrowseGroups = async () => {
    setUserSearch('')
    setView('browseGroups')
    await loadAllGroups()
  }

  const handleJoinGroup = async (chatId: string) => {
    setSubmitting(true)
    await joinGroup(chatId)
    setView('list')
    setSubmitting(false)
    await selectChat(chatId)
  }

  const handleSelectUser = async (user: User) => {
    setSubmitting(true)
    const chatId = await openPrivateChat(user.id)
    setView('list')
    setUserSearch('')
    setSubmitting(false)
    await selectChat(chatId)
  }

  const goBack = () => {
    setView('list')
    setGroupName('')
    setUserSearch('')
  }

  const getChatLabel = (chat: Chat) => {
    if (chat.type === 'Group') return chat.name ?? 'Группа'
    return chat.otherUserName ?? 'Личное'
  }

  const getChatIcon = (chat: Chat) =>
    chat.type === 'Group' ? '⬡' : '◎'

  const filteredUsers = users.filter(u =>
    u.userName.toLowerCase().includes(userSearch.toLowerCase())
  )

  if (view === 'newGroup') {
    return (
      <aside className={styles.sidebar}>
        <div className={styles.subHeader}>
          <button className={styles.backBtn} onClick={goBack} title="Назад">←</button>
          <span className={styles.subTitle}>Новая группа</span>
        </div>
        <form className={styles.groupForm} onSubmit={handleGroupCreate}>
          <input
            className={styles.groupInput}
            placeholder="Название группы"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            autoFocus
          />
          <button className={styles.groupSubmit} disabled={submitting || !groupName.trim()}>
            {submitting ? '...' : 'Создать группу'}
          </button>
        </form>
      </aside>
    )
  }

  if (view === 'browseGroups') {
    const joinedIds = new Set(chats.map(c => c.id))
    const filtered = availableGroups.filter(g =>
      g.name?.toLowerCase().includes(userSearch.toLowerCase())
    )
    return (
      <aside className={styles.sidebar}>
        <div className={styles.subHeader}>
          <button className={styles.backBtn} onClick={goBack} title="Назад">←</button>
          <span className={styles.subTitle}>Найти группу</span>
        </div>
        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            placeholder="Поиск группы…"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            autoFocus
          />
        </div>
        <nav className={styles.list}>
          {filtered.length === 0 && (
            <p className={styles.empty}>Нет групп</p>
          )}
          {filtered.map(g => {
            const already = joinedIds.has(g.id)
            return (
              <div key={g.id} className={styles.groupBrowseItem}>
                <span className={styles.chatIcon}>⬡</span>
                <span className={styles.chatLabel}>{g.name ?? 'Группа'}</span>
                {already
                  ? <span className={styles.chatBadge}>Вступил</span>
                  : (
                    <button
                      className={styles.joinBtn}
                      disabled={submitting}
                      onClick={() => handleJoinGroup(g.id)}
                    >
                      Вступить
                    </button>
                  )
                }
              </div>
            )
          })}
        </nav>
      </aside>
    )
  }

  if (view === 'newPrivate') {
    return (
      <aside className={styles.sidebar}>
        <div className={styles.subHeader}>
          <button className={styles.backBtn} onClick={goBack} title="Назад">←</button>
          <span className={styles.subTitle}>Новое сообщение</span>
        </div>
        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            placeholder="Поиск пользователя…"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            autoFocus
          />
        </div>
        <nav className={styles.list}>
          {filteredUsers.length === 0 && (
            <p className={styles.empty}>Нет пользователей</p>
          )}
          {filteredUsers.map(u => (
            <button
              key={u.id}
              className={styles.userItem}
              disabled={submitting}
              onClick={() => handleSelectUser(u)}
            >
              <span className={styles.chatIcon}>◎</span>
              <span className={styles.chatLabel}>{u.userName}</span>
            </button>
          ))}
        </nav>
      </aside>
    )
  }

  return (
    <aside className={styles.sidebar}>
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

      {showMenu && (
        <div className={styles.backdrop} onClick={() => setShowMenu(false)} />
      )}

      {showMenu && (
        <div className={styles.fabMenu}>
          <button
            className={styles.fabMenuItem}
            onClick={() => {
              setShowMenu(false);
              setGroupName('');
              setView('newGroup')
            }}
          >
            <span>⬡</span> Группа
          </button>
          <button
            className={styles.fabMenuItem}
            onClick={() => {
              setShowMenu(false);
              handleOpenPrivate()
            }}
          >
            <span>◎</span> Личное
          </button>
          <button
            className={styles.fabMenuItem}
            onClick={() => {
              setShowMenu(false);
              handleOpenBrowseGroups()
            }}
          >
            <span>⬡</span> Найти группу
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
