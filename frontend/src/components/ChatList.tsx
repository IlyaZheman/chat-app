import { useState } from 'react'
import { useChatsListStore } from '../store/useChatsListStore'
import { useMessagesStore } from '../store/useMessagesStore'
import { usePresenceStore } from '../store/usePresenceStore'
import { useAuthStore } from '../store/authStore'
import type { Chat } from '../types'
import { Icon } from './chatIcons'
import { Avatar } from './Avatar'
import NewGroupView from './NewGroupView'
import NewChannelView from './NewChannelView'
import NewPrivateView from './NewPrivateView'
import SearchPanel from './SearchPanel'
import ProfileModal from './ProfileModal'
import SettingsModal from './SettingsModal'
import {
  notificationsPermission,
  notificationsSupported,
} from '../utils/notifications'
import { previewPayload } from '../utils/messagePayloadHelpers'
import { useDebounce } from '../utils/useDebounce'
import styles from './ChatList.module.css'

interface Props {
  onLogout: () => void
  onChatOpen?: () => void
}

type View = 'list' | 'newGroup' | 'newChannel' | 'newPrivate'


function previewText(last: Chat['lastMessage']): string {
  if (!last) return 'Нет сообщений'
  if (last.deletedAt) return 'Сообщение удалено'
  return previewPayload(last.payload)
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
  const { chats } = useChatsListStore()
  const { activeChatId, selectChat } = useMessagesStore()
  const { onlineStatus, typingUsers } = usePresenceStore()

  const [showMenu, setShowMenu] = useState(false)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [view, setView] = useState<View>('list')
  const [search, setSearch] = useState('')
  const [notifPermission] = useState<NotificationPermission | 'unsupported'>(() => notificationsPermission())

  const debouncedSearch = useDebounce(search, 300)

  const goBack = () => setView('list')

  const openChat = async (chatId: string) => {
    setView('list')
    setSearch('')
    await selectChat(chatId)
    onChatOpen?.()
  }

  const getChatLabel = (chat: Chat) => {
    if (chat.type === 'Group') return chat.name ?? 'Группа'
    if (chat.type === 'Channel') return chat.name ?? 'Канал'
    return chat.otherUserName ?? 'Личное'
  }

  if (view === 'newGroup') return <NewGroupView onBack={goBack} onCreated={openChat} />
  if (view === 'newChannel') return <NewChannelView onBack={goBack} onCreated={openChat} />
  if (view === 'newPrivate') return <NewPrivateView onBack={goBack} onCreated={openChat} />

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Сообщения</h1>
          <div className={styles.headerMenuAnchor}>
            <button
              className={styles.headerAvatarBtn}
              onClick={() => { setShowHeaderMenu(v => !v); setShowMenu(false) }}
              title={auth?.userName}
              aria-label="Меню профиля"
            >
              <Avatar name={auth?.userName ?? '?'} size={30} src={auth?.avatarUrl} />
            </button>
            {showHeaderMenu && (
              <>
                <div className={styles.headerBackdrop} onClick={() => setShowHeaderMenu(false)} />
                <div className={styles.headerMenu}>
                  <button
                    className={styles.headerMenuUser}
                    onClick={() => { setShowHeaderMenu(false); setShowProfile(true) }}
                  >
                    <Avatar name={auth?.userName ?? '?'} size={36} src={auth?.avatarUrl} />
                    <div className={styles.headerMenuUserInfo}>
                      <span className={styles.headerMenuUserName}>{auth?.userName}</span>
                      <span className={styles.headerMenuUserSub}>Мой профиль</span>
                    </div>
                  </button>
                  <div className={styles.headerMenuDivider} />
                  <button
                    className={styles.headerMenuItem}
                    onClick={() => { setShowHeaderMenu(false); setShowSettings(true) }}
                  >
                    <Icon.Settings size={15} /> Настройки
                    {notifPermission === 'default' && notificationsSupported() && (
                      <span className={styles.headerMenuBadge} />
                    )}
                  </button>
                  <button
                    className={`${styles.headerMenuItem} ${styles.headerMenuItemDanger}`}
                    onClick={() => { setShowHeaderMenu(false); onLogout() }}
                  >
                    <Icon.Logout size={15} /> Выйти
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}><Icon.Search size={16} /></span>
          <input
            className={styles.searchField}
            placeholder="Поиск"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {search ? (
          <SearchPanel
            query={debouncedSearch}
            chats={chats}
            onOpenChat={openChat}
            currentUserId={auth?.userId ?? ''}
          />
        ) : (
          <nav className={styles.list}>
            {chats.length === 0 && (
              <p className={styles.empty}>Нет чатов. Создайте первый!</p>
            )}
            {chats.map(chat => {
              const last = chat.lastMessage
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
                    <Avatar name={label} size={44} src={chat.type === 'Private' ? chat.otherUserAvatarUrl : undefined} />
                    {isOnline && <span className={styles.onlineDot} aria-hidden="true" />}
                  </div>
                  <div className={styles.chatBody}>
                    <div className={styles.chatTopRow}>
                      <span className={styles.chatLabel}>{label}</span>
                      <span className={styles.chatTime}>{formatChatTime(last?.sentAt)}</span>
                    </div>
                    <div className={styles.chatPreview}>
                      <span className={styles.previewText}>
                        {typingText
                          ? <span className={styles.typingPreview}>{typingText}</span>
                          : (
                            <>
                              {last?.senderName && last.senderName === auth?.userName && (
                                <span className={styles.previewYou}>Вы: </span>
                              )}
                              {previewText(last)}
                            </>
                          )
                        }
                      </span>
                      {(chat.unreadCount ?? 0) > 0 && !isActive && (
                        <span className={styles.unreadBadge}>
                          {chat.unreadCount! > 99 ? '99+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        )}

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
              onClick={() => { setShowMenu(false); setView('newChannel') }}
            >
              <Icon.Channel size={16} /> Канал
            </button>
          </div>
        )}

        <button
          className={`${styles.fab} ${showMenu ? styles.fabOpen : ''}`}
          onClick={() => { setShowMenu(v => !v); setShowHeaderMenu(false) }}
          title="Создать чат"
          aria-label="Создать чат"
        >
          <Icon.Plus size={20} />
        </button>
      </aside>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
