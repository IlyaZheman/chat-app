import { useEffect, useMemo, useState } from 'react'

import { useChatsListStore } from '../store/useChatsListStore'
import { useToastStore } from '../store/toastStore'
import { Icon } from './chatIcons'
import { Avatar } from './Avatar'
import styles from './ChatList.module.css'

interface Props {
  onBack: () => void
  onJoined: (chatId: string) => void
}

export default function BrowseGroupsView({ onBack, onJoined }: Props) {
  const { chats, availableGroups, loadAllGroups, joinGroup } = useChatsListStore()
  const showToast = useToastStore(s => s.show)
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
    } catch {
      showToast('Не удалось вступить в группу')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.subHeader}>
        <button className={styles.backBtn} onClick={onBack} title="Назад" aria-label="Назад">
          <Icon.ArrowLeft size={18} />
        </button>
        <span className={styles.subTitle}>Найти группу</span>
      </div>
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}><Icon.Search size={16} /></span>
        <input
          className={styles.searchField}
          placeholder="Поиск группы"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <nav className={styles.list}>
        {filtered.length === 0 && <p className={styles.empty}>Нет групп</p>}
        {filtered.map(g => {
          const already = joinedIds.has(g.id)
          const name = g.name ?? 'Группа'
          return (
            <div key={g.id} className={styles.groupBrowseItem}>
              <Avatar name={name} size={40} />
              <span className={styles.chatLabel}>{name}</span>
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
