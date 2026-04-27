import { useEffect, useState } from 'react'
import { useChatsStore } from '../store/chatsStore'
import { usersApi } from '../api/usersApi'
import type { User } from '../types'
import { ChatIcons } from './chatIcons'
import styles from './ChatList.module.css'

interface Props {
  onBack: () => void
  onCreated: (chatId: string) => void
}

export default function NewPrivateView({ onBack, onCreated }: Props) {
  const openPrivateChat = useChatsStore(s => s.openPrivateChat)
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    usersApi.getUsers().then(setUsers)
  }, [])

  const handleSelect = async (user: User) => {
    setSubmitting(true)
    try {
      const chatId = await openPrivateChat(user.id)
      onCreated(chatId)
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = users.filter(u =>
    u.userName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside className={styles.sidebar}>
      <div className={styles.subHeader}>
        <button className={styles.backBtn} onClick={onBack} title="Назад">←</button>
        <span className={styles.subTitle}>Новое сообщение</span>
      </div>
      <div className={styles.searchWrap}>
        <input
          className={styles.searchInput}
          placeholder="Поиск пользователя…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <nav className={styles.list}>
        {filtered.length === 0 && <p className={styles.empty}>Нет пользователей</p>}
        {filtered.map(u => (
          <button
            key={u.id}
            className={styles.userItem}
            disabled={submitting}
            onClick={() => handleSelect(u)}
          >
            <span className={styles.chatIcon}>{ChatIcons.private}</span>
            <span className={styles.chatLabel}>{u.userName}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
