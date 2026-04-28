import { useState } from 'react'
import { useChatsStore } from '../store/chatsStore'
import { Icon } from './chatIcons'
import styles from './ChatList.module.css'

interface Props {
  onBack: () => void
  onCreated: (chatId: string) => void
}

export default function NewGroupView({ onBack, onCreated }: Props) {
  const createGroup = useChatsStore(s => s.createGroup)
  const [groupName, setGroupName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = groupName.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const chatId = await createGroup(trimmed)
      onCreated(chatId)
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
        <span className={styles.subTitle}>Новая группа</span>
      </div>
      <form className={styles.groupForm} onSubmit={handleSubmit}>
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
