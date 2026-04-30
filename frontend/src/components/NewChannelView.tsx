import { useState } from 'react'
import { useChatsListStore } from '../store/useChatsListStore'
import { useToastStore } from '../store/toastStore'
import { Icon } from './chatIcons'
import styles from './ChatList.module.css'

interface Props {
  onBack: () => void
  onCreated: (chatId: string) => void
}

export default function NewChannelView({ onBack, onCreated }: Props) {
  const createChannel = useChatsListStore(s => s.createChannel)
  const showToast = useToastStore(s => s.show)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const chatId = await createChannel(trimmed)
      onCreated(chatId)
    } catch {
      showToast('Не удалось создать канал')
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
        <span className={styles.subTitle}>Новый канал</span>
      </div>
      <form className={styles.groupForm} onSubmit={handleSubmit}>
        <input
          className={styles.groupInput}
          placeholder="Название канала"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
        <button className={styles.groupSubmit} disabled={submitting || !name.trim()}>
          {submitting ? '...' : 'Создать канал'}
        </button>
      </form>
    </aside>
  )
}
