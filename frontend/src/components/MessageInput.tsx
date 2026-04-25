import { useRef, useState } from 'react'
import type { MessagePayload } from '../types'
import { uploadsApi } from '../api/uploadsApi'
import styles from './MessageInput.module.css'

const MAX_SIZE = 10 * 1024 * 1024

interface Props {
  onSend: (payload: MessagePayload) => void
  disabled?: boolean
}

export default function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isImage = (file: File) => file.type.startsWith('image/')
  const previewUrl = pendingFile && isImage(pendingFile) ? URL.createObjectURL(pendingFile) : null
  const canSend = (text.trim() || pendingFile) && !disabled && !uploading

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_SIZE) {
      setFileError('Файл превышает 10 МБ')
      return
    }
    setFileError(null)
    setPendingFile(file)
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!canSend) return

    if (pendingFile) {
      setUploading(true)
      try {
        const result = await uploadsApi.upload(pendingFile)
        const payload: MessagePayload = isImage(pendingFile)
          ? { type: 'image', url: result.url, fileName: result.fileName, caption: trimmed || undefined }
          : { type: 'file', url: result.url, fileName: result.fileName, mediaType: result.mediaType }
        onSend(payload)
      } catch {
        setFileError('Не удалось загрузить файл')
        return
      } finally {
        setUploading(false)
      }
    } else {
      onSend({ type: 'text', text: trimmed })
    }

    setText('')
    setPendingFile(null)
    setFileError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className={styles.wrapper}>
      {pendingFile && (
        <div className={styles.preview}>
          {previewUrl
            ? <img src={previewUrl} alt={pendingFile.name} className={styles.previewImage} />
            : <span className={styles.previewPill}>📎 {pendingFile.name}</span>
          }
          <button
            type="button"
            className={styles.removeFile}
            onClick={() => { setPendingFile(null); setFileError(null) }}
            aria-label="Удалить файл"
          >×</button>
        </div>
      )}
      {fileError && <p className={styles.fileError}>{fileError}</p>}
      <form className={styles.form} onSubmit={handleSubmit}>
        <button
          type="button"
          className={styles.attachBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          title="Прикрепить файл"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.docx,.txt,.zip"
          className={styles.fileInput}
          onChange={handleFileChange}
        />
        <textarea
          className={styles.input}
          placeholder={pendingFile ? 'Подпись (необязательно)…' : 'Напишите сообщение… (Enter — отправить)'}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || uploading}
          rows={1}
        />
        <button
          className={styles.sendBtn}
          type="submit"
          disabled={!canSend}
          title={uploading ? 'Загрузка…' : 'Отправить'}
        >
          {uploading ? '…' : '↑'}
        </button>
      </form>
    </div>
  )
}
