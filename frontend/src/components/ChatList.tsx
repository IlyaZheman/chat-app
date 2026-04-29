import { useMemo, useState } from 'react'
import { useChatsStore } from '../store/chatsStore'
import { useAuthStore } from '../store/authStore'
import type { Chat, MessagePayload } from '../types'
import { Icon } from './chatIcons'
import { Avatar } from './Avatar'
import NewGroupView from './NewGroupView'
import NewPrivateView from './NewPrivateView'
import BrowseGroupsView from './BrowseGroupsView'
import styles from './ChatList.module.css'

interface Props {
  onLogout: () => void
  onChatOpen?: () => void
}

type View = 'list' | 'newGroup' | 'newPrivate' | 'browseGroups'


function previewText(p: MessagePayload | undefined): string {
  if (!p) return 'Нет сообщений'
  if (p.type === 'text') return p.text
  if (p.type === 'image') return p.caption ? `📷 ${p.caption}` : 'Изображение'
  return p.fileName ?? 'Файл'
}

function formatChatTime(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'вчера'
  return d.toLocaleDateString('ru', { day: '2-digit', month: 'short' })
}


export default function ChatList({ onLogout, onChatOpen }: Props) {
  const auth = useAuthStore(s => s.auth)
  const { chats, messages, activeChatId, selectChat, onlineStatus, typingUsers } = useChatsStore()

  const [showMenu, setShowMenu] = useState(false)
  const [view, setView] = useState<View>('list')
  const [search, setSearch] = useState('')

  const goBack = () => setView('list')

  const openChat = async (chatId: string) => {
    setView('list')
    await selectChat(chatId)
    onChatOpen?.()
  }

  const getChatLabel = (chat: Chat) => {
    if (chat.type === 'Group') return chat.name ?? 'Группа'
    return chat.otherUserName ?? 'Личное'
  }

  const decorated = useMemo(() => {
    return chats.map(chat => {
      const list = messages[chat.id] ?? []
      const last = list[list.length - 1]
      return { chat, last }
    })
  }, [chats, messages])

  if (view === 'newGroup') return <NewGroupView onBack={goBack} onCreated={openChat} />
  if (view === 'browseGroups') return <BrowseGroupsView onBack={goBack} onJoined={openChat} />
  if (view === 'newPrivate') return <NewPrivateView onBack={goBack} onCreated={openChat} />

  const filtered = decorated.filter(({ chat }) =>
    getChatLabel(chat).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Сообщения</h1>
        <button className={styles.iconBtn} title="Фильтры" aria-label="Фильтры">
          <Icon.More size={18} />
        </button>
      </div>

      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}><Icon.Search size={16} /></span>
        <input
          className={styles.searchField}
          placeholder="Поиск чатов"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <nav className={styles.list}>
        {filtered.length === 0 && (
          <p className={styles.empty}>
            {search ? 'Ничего не найдено' : 'Нет чатов. Создайте первый!'}
          </p>
        )}
        {filtered.map(({ chat, last }) => {
          const label = getChatLabel(chat)
          const isActive = activeChatId === chat.id
          const isOnline = chat.type === 'Private' && (
            (chat.otherUserId ? onlineStatus[chat.otherUserId] : chat.isOnline) ?? false
          )
          const typing = typingUsers[chat.id] ?? []
          const typingText = typing.length === 1
            ? `${typing[0]} печатает…`
            : typing.length > 1
              ? `${typing[0]}, ${typing[1]} печатают…`
              : null
          return (
            <button
              key={chat.id}
              className={`${styles.chatItem} ${isActive ? styles.active : ''}`}
              onClick={() => {
                selectChat(chat.id)
                onChatOpen?.()
              }}
            >
              <div className={styles.avatarWrap}>
                <Avatar name={label} size={44} />
                {isOnline && <span className={styles.onlineDot} aria-hidden="true" />}
              </div>
              <div className={styles.chatBody}>
                <div className={styles.chatTopRow}>
                  <span className={styles.chatLabel}>{label}</span>
                  <span className={styles.chatTime}>{formatChatTime(last?.sentAt)}</span>
                </div>
                <div className={styles.chatPreview}>
                  {typingText
                    ? <span className={styles.typingPreview}>{typingText}</span>
                    : (
                      <>
                        {last?.senderName && last.senderName === auth?.userName && (
                          <span className={styles.previewYou}>Вы: </span>
                        )}
                        {previewText(last?.payload)}
                      </>
                    )
                  }
                </div>
              </div>
            </button>
          )
        })}
      </nav>

      {showMenu && <div className={styles.backdrop} onClick={() => setShowMenu(false)} />}

      {showMenu && (
        <div className={styles.fabMenu}>
          <button
            className={styles.fabMenuItem}
            onClick={() => { setShowMenu(false); setView('newPrivate') }}
          >
            <Icon.Private size={16} /> Личное
          </button>
          <button
            className={styles.fabMenuItem}
            onClick={() => { setShowMenu(false); setView('newGroup') }}
          >
            <Icon.Group size={16} /> Группа
          </button>
          <button
            className={styles.fabMenuItem}
            onClick={() => { setShowMenu(false); setView('browseGroups') }}
          >
            <Icon.Compass size={16} /> Найти группу
          </button>
        </div>
      )}

      <button
        className={`${styles.fab} ${showMenu ? styles.fabOpen : ''}`}
        onClick={() => setShowMenu(v => !v)}
        title="Создать чат"
        aria-label="Создать чат"
      >
        <Icon.Plus size={20} />
      </button>

      <div className={styles.accountBar}>
        <Avatar name={auth?.userName ?? '?'} size={36} />
        <div className={styles.accountInfo}>
          <span className={styles.accountName}>{auth?.userName}</span>
          <span className={styles.accountStatus}>В сети</span>
        </div>
        <button className={styles.accountAction} title="Настройки" aria-label="Настройки">
          <Icon.Settings size={16} />
        </button>
        <button
          className={`${styles.accountAction} ${styles.accountActionDanger}`}
          onClick={onLogout}
          title="Выйти"
          aria-label="Выйти"
        >
          <Icon.Logout size={16} />
        </button>
      </div>
    </aside>
  )
}
