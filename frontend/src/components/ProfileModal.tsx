import { useState, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { usersApi } from '../api/usersApi'
import { uploadsApi } from '../api/uploadsApi'
import { Avatar } from './Avatar'
import { Icon } from './chatIcons'
import styles from './ProfileModal.module.css'

interface Props {
  onClose: () => void
}

export default function ProfileModal({ onClose }: Props) {
  const auth = useAuthStore(s => s.auth)
  const setAuth = useAuthStore(s => s.setAuth)

  const [userName, setUserName] = useState(auth?.userName ?? '')
  const [displayAvatar, setDisplayAvatar] = useState<string | null>(auth?.avatarUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setError('')
    try {
      const result = await uploadsApi.upload(file)
      setDisplayAvatar(result.url)
    } catch {
      setError('Не удалось загрузить изображение')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    const trimmedName = userName.trim()
    if (!trimmedName) return
    setSaving(true)
    setError('')
    try {
      const payload: Parameters<typeof usersApi.updateProfile>[0] = {}
      if (trimmedName !== auth?.userName) payload.userName = trimmedName
      if (displayAvatar !== (auth?.avatarUrl ?? null)) {
        if (displayAvatar === null) payload.clearAvatar = true
        else payload.avatarUrl = displayAvatar
      }
      if (Object.keys(payload).length > 0) {
        const updated = await usersApi.updateProfile(payload)
        setAuth(updated)
      }
      onClose()
    } catch {
      setError('Не удалось сохранить изменения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Профиль</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <Icon.Close size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.avatarSection}>
            <button
              className={styles.avatarBtn}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Изменить фото"
            >
              <Avatar name={userName || '?'} size={80} src={displayAvatar} />
              <div className={styles.avatarOverlay}>
                {uploading ? <span className={styles.spinner} /> : <Icon.Image size={18} />}
              </div>
            </button>
            {displayAvatar && (
              <button className={styles.removeAvatarBtn} onClick={() => setDisplayAvatar(null)}>
                Удалить фото
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          <label className={styles.fieldLabel}>Имя пользователя</label>
          <input
            className={styles.fieldInput}
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="Ваше имя"
            maxLength={50}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Отмена</button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || !userName.trim()}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
