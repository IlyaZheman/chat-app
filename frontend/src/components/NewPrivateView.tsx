import { useEffect, useState } from 'react'
import { useChatsListStore } from '../store/useChatsListStore'
import { useToastStore } from '../store/toastStore'
import { usersApi } from '../api/usersApi'
import type { User } from '../types'
import { Icon } from './chatIcons'
import { Avatar } from './Avatar'
import styles from './ChatList.module.css'

interface Props {
  onBack: () => void
  onCreated: (chatId: string) => void
}

export default function NewPrivateView({ onBack, onCreated }: Props) {
  const openPrivateChat = useChatsListStore(s => s.openPrivateChat)
  const showToast = useToastStore(s => s.show)
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    usersApi.getUsers().then(setUsers).catch(() => showToast('Не удалось загрузить список пользователей'))
  }, [])

  const handleSelect = async (user: User) => {
    setSubmitting(true)
    try {
      const chatId = await openPrivateChat(user.id)
      onCreated(chatId)
    } catch {
      showToast('Не удалось открыть чат')
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
        <button className={styles.backBtn} onClick={onBack} title="Назад" aria-label="Назад">
          <Icon.ArrowLeft size={18} />
        </button>
        <span className={styles.subTitle}>Новое сообщение</span>
      </div>
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}><Icon.Search size={16} /></span>
        <input
          className={styles.searchField}
          placeholder="Поиск пользователя"
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
            <Avatar name={u.userName} size={40} />
            <span className={styles.chatLabel}>{u.userName}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
