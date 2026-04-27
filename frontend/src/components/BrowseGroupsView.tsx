import { useEffect, useMemo, useState } from 'react'
import { useChatsStore } from '../store/chatsStore'
import { ChatIcons } from './chatIcons'
import styles from './ChatList.module.css'

interface Props {
  onBack: () => void
  onJoined: (chatId: string) => void
}

export default function BrowseGroupsView({ onBack, onJoined }: Props) {
  const { chats, availableGroups, loadAllGroups, joinGroup } = useChatsStore()
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadAllGroups()
  }, [loadAllGroups])

  const joinedIds = useMemo(() => new Set(chats.map(c => c.id)), [chats])
  const filtered = availableGroups.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleJoin = async (chatId: string) => {
    setSubmitting(true)
    try {
      await joinGroup(chatId)
      onJoined(chatId)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.subHeader}>
        <button className={styles.backBtn} onClick={onBack} title="Назад">←</button>
        <span className={styles.subTitle}>Найти группу</span>
      </div>
      <div className={styles.searchWrap}>
        <input
          className={styles.searchInput}
          placeholder="Поиск группы…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <nav className={styles.list}>
        {filtered.length === 0 && <p className={styles.empty}>Нет групп</p>}
        {filtered.map(g => {
          const already = joinedIds.has(g.id)
          return (
            <div key={g.id} className={styles.groupBrowseItem}>
              <span className={styles.chatIcon}>{ChatIcons.group}</span>
              <span className={styles.chatLabel}>{g.name ?? 'Группа'}</span>
              {already
                ? <span className={styles.chatBadge}>Вступил</span>
                : (
                  <button
                    className={styles.joinBtn}
                    disabled={submitting}
                    onClick={() => handleJoin(g.id)}
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
