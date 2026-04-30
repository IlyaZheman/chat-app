import { useEffect, useMemo, useRef, useState } from 'react'
import type { MessagePayload } from '../types'
import { uploadsApi } from '../api/uploadsApi'
import { usePresenceStore } from '../store/usePresenceStore'
import { Icon } from './chatIcons'
import styles from './MessageInput.module.css'

const MAX_SIZE = 10 * 1024 * 1024
const TYPING_THROTTLE_MS = 3000
const TYPING_STOP_DELAY_MS = 5000

interface EditTarget {
  messageId: string
  initialText: string
}

interface Props {
  onSend: (payload: MessagePayload) => void
  chatId?: string
  disabled?: boolean
  editTarget?: EditTarget | null
  onCancelEdit?: () => void
  onSubmitEdit?: (messageId: string, text: string) => Promise<void> | void
}

export default function MessageInput({ onSend, chatId, disabled, editTarget, onCancelEdit, onSubmitEdit }: Props) {
  const [text, setText] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { notifyStartTyping, notifyStopTyping } = usePresenceStore()
  const lastTypingSentRef = useRef<number>(0)
  const stopTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isImage = (file: File) => file.type.startsWith('image/')

  const previewUrl = useMemo(
    () => (pendingFile && isImage(pendingFile) ? URL.createObjectURL(pendingFile) : null),
    [pendingFile],
  )

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  useEffect(() => {
    if (editTarget) {
      setText(editTarget.initialText)
      setPendingFile(null)
      setFileError(null)
      setTimeout(() => textareaRef.current?.focus(), 0)
    }
  }, [editTarget?.messageId])

  const isEditing = !!editTarget
  const canSend = isEditing
    ? text.trim().length > 0 && !disabled
    : (text.trim() || pendingFile) && !disabled && !uploading

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

  const stopTyping = () => {
    if (!chatId) return
    if (stopTypingTimerRef.current) {
      clearTimeout(stopTypingTimerRef.current)
      stopTypingTimerRef.current = null
    }
    notifyStopTyping(chatId)
    lastTypingSentRef.current = 0
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    if (!chatId || isEditing) return
    if (!e.target.value) { stopTyping(); return }
    const now = Date.now()
    if (now - lastTypingSentRef.current > TYPING_THROTTLE_MS) {
      lastTypingSentRef.current = now
      notifyStartTyping(chatId)
    }
    if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current)
    stopTypingTimerRef.current = setTimeout(() => {
      notifyStopTyping(chatId)
      lastTypingSentRef.current = 0
      stopTypingTimerRef.current = null
    }, TYPING_STOP_DELAY_MS)
  }

  const cancelEdit = () => {
    onCancelEdit?.()
    setText('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!canSend) return

    if (isEditing && editTarget && onSubmitEdit) {
      try {
        await onSubmitEdit(editTarget.messageId, trimmed)
      } catch {
        return
      }
      setText('')
      setFileError(null)
      return
    }

    if (pendingFile) {
      setUploading(true)
      try {
        const result = await uploadsApi.upload(pendingFile)
        const payload: MessagePayload = isImage(pendingFile)
          ? { type: 'image', url: result.url, fileName: result.fileName, mediaType: result.mediaType, fileSize: result.fileSize, caption: trimmed || undefined }
          : { type: 'file', url: result.url, fileName: result.fileName, mediaType: result.mediaType, fileSize: result.fileSize }
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

    stopTyping()
    setText('')
    setPendingFile(null)
    setFileError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isEditing) {
      e.preventDefault()
      cancelEdit()
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className={styles.wrapper}>
      {isEditing && (
        <div className={styles.editBanner}>
          <Icon.Edit size={14} />
          <span className={styles.editBannerText}>Редактирование сообщения</span>
          <button
            type="button"
            className={styles.removeFile}
            onClick={cancelEdit}
            aria-label="Отменить редактирование"
            title="Отменить (Esc)"
          >
            <Icon.Close size={14} />
          </button>
        </div>
      )}
      {pendingFile && !isEditing && (
        <div className={styles.preview}>
          {previewUrl
            ? <img src={previewUrl} alt={pendingFile.name} className={styles.previewImage} />
            : (
              <span className={styles.previewPill}>
                <Icon.File size={14} />
                {pendingFile.name}
              </span>
            )
          }
          <button
            type="button"
            className={styles.removeFile}
            onClick={() => { setPendingFile(null); setFileError(null) }}
            aria-label="Удалить файл"
          >
            <Icon.Close size={14} />
          </button>
        </div>
      )}
      {fileError && <p className={styles.fileError}>{fileError}</p>}
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputBar}>
          {!isEditing && (
            <>
              <button
                type="button"
                className={styles.attachBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                title="Прикрепить файл"
                aria-label="Прикрепить файл"
              >
                <Icon.Paperclip size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.docx,.txt,.zip,.mp4,.webm,.mov,.mp3,.wav,.ogg"
                className={styles.fileInput}
                onChange={handleFileChange}
              />
            </>
          )}
          <textarea
            ref={textareaRef}
            className={styles.input}
            placeholder={isEditing ? 'Редактируйте сообщение…' : pendingFile ? 'Подпись (необязательно)…' : 'Сообщение'}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
            disabled={disabled || uploading}
            rows={1}
          />
        </div>
        <button
          className={styles.sendBtn}
          type="submit"
          disabled={!canSend}
          title={isEditing ? 'Сохранить' : uploading ? 'Загрузка…' : 'Отправить'}
          aria-label={isEditing ? 'Сохранить' : 'Отправить'}
        >
          {isEditing ? <Icon.Check size={18} /> : <Icon.Send size={18} />}
        </button>
      </form>
    </div>
  )
}
