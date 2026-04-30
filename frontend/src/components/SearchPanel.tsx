import { useState, useEffect, useCallback } from 'react'
import type { Chat, ChannelChat, User } from '../types'
import { useChatsListStore } from '../store/useChatsListStore'
import { usersApi } from '../api/usersApi'
import { chatsApi } from '../api/chatsApi'
import { Avatar } from './Avatar'
import { Icon } from './chatIcons'
import { previewPayload } from '../utils/messagePayloadHelpers'
import styles from './SearchPanel.module.css'

interface Props {
  query: string
  chats: Chat[]
  onOpenChat: (chatId: string) => void
  currentUserId: string
}

function getChatLabel(chat: Chat): string {
  if (chat.type === 'Group') return chat.name ?? 'Группа'
  if (chat.type === 'Channel') return chat.name ?? 'Канал'
  return chat.otherUserName ?? 'Личное'
}

function getChatSub(chat: Chat): string {
  if (!chat.lastMessage) return ''
  if (chat.lastMessage.deletedAt) return 'Сообщение удалено'
  return previewPayload(chat.lastMessage.payload)
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const q = query.toLowerCase()
  const idx = text.toLowerCase().indexOf(q)
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <span className={styles.highlight}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}

const MAX_VISIBLE = 5

export default function SearchPanel({ query, chats, onOpenChat, currentUserId }: Props) {
  const { openPrivateChat, joinGroup } = useChatsListStore()

  const [users, setUsers] = useState<User[]>([])
  const [allChannels, setAllChannels] = useState<ChannelChat[]>([])
  const [showMoreChats, setShowMoreChats] = useState(false)
  const [showMorePeople, setShowMorePeople] = useState(false)
  const [showMoreChannels, setShowMoreChannels] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    usersApi.getUsers().then(setUsers)
    chatsApi.getAllGroups().then(groups =>
      setAllChannels(groups.filter((g): g is ChannelChat => g.type === 'Channel'))
    )
  }, [])

  useEffect(() => {
    setShowMoreChats(false)
    setShowMorePeople(false)
    setShowMoreChannels(false)
  }, [query])

  const q = query.toLowerCase()

  const filteredChats = chats
    .filter(c => getChatLabel(c).toLowerCase().includes(q))
    .sort((a, b) => {
      const aExact = getChatLabel(a).toLowerCase() === q
      const bExact = getChatLabel(b).toLowerCase() === q
      if (aExact === bExact) return 0
      return aExact ? -1 : 1
    })

  const filteredPeople = users.filter(
    u => u.id !== currentUserId && u.userName.toLowerCase().includes(q)
  )

  const filteredChannels = allChannels.filter(
    c => (c.name ?? '').toLowerCase().includes(q)
  )

  const noResults =
    filteredChats.length === 0 &&
    filteredPeople.length === 0 &&
    filteredChannels.length === 0

  const handleChatClick = (chatId: string) => onOpenChat(chatId)

  const handlePersonClick = useCallback(async (userId: string) => {
    setBusyId(userId)
    try {
      const chatId = await openPrivateChat(userId)
      onOpenChat(chatId)
    } finally {
      setBusyId(null)
    }
  }, [openPrivateChat, onOpenChat])

  const handleChannelClick = useCallback(async (channel: ChannelChat) => {
    setBusyId(channel.id)
    try {
      const alreadyJoined = chats.some(c => c.id === channel.id)
      if (!alreadyJoined) await joinGroup(channel.id)
      onOpenChat(channel.id)
    } finally {
      setBusyId(null)
    }
  }, [chats, joinGroup, onOpenChat])

  if (!query) return <div className={styles.panel} />

  if (noResults) {
    return (
      <div className={styles.panel}>
        <div className={styles.noResults}>
          <span className={styles.noResultsIcon}><Icon.Search size={32} /></span>
          <span className={styles.noResultsText}>No Results</span>
        </div>
      </div>
    )
  }

  const visibleChats = showMoreChats ? filteredChats : filteredChats.slice(0, MAX_VISIBLE)
  const visiblePeople = showMorePeople ? filteredPeople : filteredPeople.slice(0, MAX_VISIBLE)
  const visibleChannels = showMoreChannels ? filteredChannels : filteredChannels.slice(0, MAX_VISIBLE)

  return (
    <div className={styles.panel}>
      {filteredChats.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Chats</span>
            {filteredChats.length > MAX_VISIBLE && !showMoreChats && (
              <button className={styles.moreBtn} onClick={() => setShowMoreChats(true)}>
                More
              </button>
            )}
          </div>
          {visibleChats.map(chat => {
            const label = getChatLabel(chat)
            const sub = getChatSub(chat)
            const avatarSrc = chat.type === 'Private' ? chat.otherUserAvatarUrl : undefined
            return (
              <button
                key={chat.id}
                className={styles.item}
                onClick={() => handleChatClick(chat.id)}
              >
                <Avatar name={label} size={40} src={avatarSrc} />
                <div className={styles.itemBody}>
                  <span className={styles.itemLabel}>
                    <Highlighted text={label} query={query} />
                  </span>
                  {sub && <span className={styles.itemSub}>{sub}</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {filteredPeople.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>People</span>
            {filteredPeople.length > MAX_VISIBLE && !showMorePeople && (
              <button className={styles.moreBtn} onClick={() => setShowMorePeople(true)}>
                More
              </button>
            )}
          </div>
          {visiblePeople.map(user => (
            <button
              key={user.id}
              className={styles.item}
              disabled={busyId === user.id}
              onClick={() => handlePersonClick(user.id)}
            >
              <Avatar name={user.userName} size={40} />
              <div className={styles.itemBody}>
                <span className={styles.itemLabel}>
                  <Highlighted text={user.userName} query={query} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {filteredChannels.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Channels</span>
            {filteredChannels.length > MAX_VISIBLE && !showMoreChannels && (
              <button className={styles.moreBtn} onClick={() => setShowMoreChannels(true)}>
                More
              </button>
            )}
          </div>
          {visibleChannels.map(channel => {
            const name = channel.name ?? 'Канал'
            const members = channel.memberCount
            return (
              <button
                key={channel.id}
                className={styles.item}
                disabled={busyId === channel.id}
                onClick={() => handleChannelClick(channel)}
              >
                <Avatar name={name} size={40} />
                <div className={styles.itemBody}>
                  <span className={styles.itemLabel}>
                    <Highlighted text={name} query={query} />
                  </span>
                  {members != null && (
                    <span className={styles.itemSub}>{members} участников</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
