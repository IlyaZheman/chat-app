import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useMarkRead } from '../hooks/useMarkRead'
import { useMessagesStore, selectChatMessages } from '../store/useMessagesStore'
import { useChatsListStore, selectOtherUserId } from '../store/useChatsListStore'
import { usePresenceStore } from '../store/usePresenceStore'
import { useReadReceiptsStore, selectOtherReadAt } from '../store/useReadReceiptsStore'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import MessageInput from './MessageInput'
import MessageContent from './MessageContent'
import ImageLightbox from './ImageLightbox'
import { Avatar } from './Avatar'
import { Icon } from './chatIcons'
import type { Chat, Message } from '../types'
import styles from './ChatWindow.module.css'

const NEAR_BOTTOM_PX = 80

function isNearBottom(el: HTMLElement) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
}

interface Props {
  chat: Chat
  onBack: () => void
  onToggleDetails: () => void
  detailsOpen: boolean
}

interface LightboxImage {
  url: string
  fileName: string
  fileSize?: number
}

interface EditTarget {
  messageId: string
  initialText: string
}

export default function ChatWindow({ chat, onBack, onToggleDetails, detailsOpen }: Props) {
  const auth = useAuthStore(s => s.auth)
  const showToast = useToastStore(s => s.show)
  const { hasMore, loadingMore, firstUnreadIds, sendMessage, loadMoreMessages, editMessage, deleteMessage } = useMessagesStore()
  const chatMessages = useMessagesStore(useShallow(selectChatMessages(chat.id)))
  const { onlineStatus, onlineCounts, typingUsers } = usePresenceStore()
  const otherUserId = useChatsListStore(selectOtherUserId(chat.id))
  const otherReadAt = useReadReceiptsStore(selectOtherReadAt(chat.id, otherUserId))
  useMarkRead(chat.id)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const unreadDividerRef = useRef<HTMLDivElement | null>(null)
  const prevLengthRef = useRef(0)
  const savedScrollHeightRef = useRef<number | null>(null)
  const wasAtBottomRef = useRef(true)
  const needsInitialScrollRef = useRef(true)
  const lastChatIdRef = useRef<string | null>(null)
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null)
  const [contextMenu, setContextMenu] = useState<{ message: Message; x: number; y: number } | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)

  const firstUnreadId = firstUnreadIds[chat.id] ?? null

  useLayoutEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    if (lastChatIdRef.current !== chat.id) {
      lastChatIdRef.current = chat.id
      needsInitialScrollRef.current = true
      prevLengthRef.current = 0
      savedScrollHeightRef.current = null
      wasAtBottomRef.current = true
      unreadDividerRef.current = null
      setContextMenu(null)
      setEditTarget(null)
    }

    const prev = prevLengthRef.current
    const curr = chatMessages.length
    prevLengthRef.current = curr

    if (needsInitialScrollRef.current && curr > 0) {
      needsInitialScrollRef.current = false
      const divider = unreadDividerRef.current
      if (divider) {
        divider.scrollIntoView({ behavior: 'auto', block: 'center' })
      } else {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      }
      wasAtBottomRef.current = isNearBottom(el)
      return
    }

    if (savedScrollHeightRef.current !== null) {
      const diff = el.scrollHeight - savedScrollHeightRef.current
      el.scrollTop = diff
      savedScrollHeightRef.current = null
      return
    }

    if (curr > prev && wasAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chat.id, chatMessages.length, firstUnreadId])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const onScroll = () => {
      wasAtBottomRef.current = isNearBottom(el)
      if (el.scrollTop < 80 && hasMore[chat.id] && !loadingMore[chat.id]) {
        savedScrollHeightRef.current = el.scrollHeight
        loadMoreMessages(chat.id)
      }
      setContextMenu(null)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [chat.id, hasMore, loadingMore, loadMoreMessages])

  useEffect(() => {
    if (!contextMenu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [contextMenu])

  useLayoutEffect(() => {
    if (!contextMenu) {
      if (menuPos !== null) setMenuPos(null)
      return
    }
    const el = menuRef.current
    if (!el) return
    const margin = 8
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let x = contextMenu.x
    let y = contextMenu.y
    if (x + rect.width + margin > vw) x = vw - rect.width - margin
    if (y + rect.height + margin > vh) y = vh - rect.height - margin
    if (x < margin) x = margin
    if (y < margin) y = margin
    if (!menuPos || menuPos.x !== x || menuPos.y !== y) {
      setMenuPos({ x, y })
    }
  }, [contextMenu])

  const getChatTitle = () => {
    if (chat.type === 'Group') return chat.name ?? 'Группа'
    if (chat.type === 'Channel') return chat.name ?? 'Канал'
    return chat.otherUserName ?? 'Личное сообщение'
  }

  const getSubtitle = () => {
    const typing = typingUsers[chat.id] ?? []
    if (typing.length === 1) return `${typing[0]} печатает…`
    if (typing.length === 2) return `${typing[0]}, ${typing[1]} печатают…`
    if (typing.length > 2) return `${typing[0]} и ещё ${typing.length - 1} печатают…`

    if (chat.type === 'Group' || chat.type === 'Channel') {
      const counts = onlineCounts[chat.id]
      if (counts) return `${counts.members} участников, ${counts.online} онлайн`
      if (chat.memberCount) return `${chat.memberCount} участников`
      return chat.type === 'Channel' ? 'Канал' : 'Группа'
    }

    const partnerId = chat.otherUserId
    if (partnerId) return onlineStatus[partnerId] ? 'В сети' : 'Не в сети'
    return chat.isOnline ? 'В сети' : 'Не в сети'
  }

  const isPartnerOnline = chat.type === 'Private' && (
    (chat.otherUserId ? onlineStatus[chat.otherUserId] : chat.isOnline) ?? false
  )

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })

  const title = getChatTitle()
  const subtitle = getSubtitle()

  const handleStartEdit = (msg: Message) => {
    if (msg.payload.type !== 'text') return
    setEditTarget({ messageId: msg.id, initialText: msg.payload.text })
    setContextMenu(null)
  }

  const handleDelete = async (msg: Message) => {
    setContextMenu(null)
    if (!confirm('Удалить сообщение?')) return
    try {
      await deleteMessage(chat.id, msg.id)
    } catch {
      showToast('Не удалось удалить сообщение')
    }
  }

  const openContextMenu = (msg: Message, e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ message: msg, x: e.clientX, y: e.clientY })
  }

  const handleSubmitEdit = async (messageId: string, text: string) => {
    try {
      await editMessage(chat.id, messageId, text)
      setEditTarget(null)
    } catch {
      showToast('Не удалось сохранить изменения')
      throw new Error('edit failed')
    }
  }

  const isReadByOther = (msg: Message): boolean => {
    if (!otherReadAt) return false
    return new Date(msg.sentAt).getTime() <= new Date(otherReadAt).getTime()
  }

  return (
    <div className={styles.window}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Назад">
          <Icon.ArrowLeft size={18} />
        </button>
        <button
          type="button"
          className={styles.headerInfo}
          onClick={onToggleDetails}
          aria-label={detailsOpen ? 'Скрыть детали чата' : 'Показать детали чата'}
          aria-expanded={detailsOpen}
        >
          <div className={styles.avatarWrap}>
            <Avatar name={title} size={40} src={chat.type === 'Private' ? chat.otherUserAvatarUrl : undefined} />
            {isPartnerOnline && <span className={styles.onlineDot} aria-hidden="true" />}
          </div>
          <div className={styles.chatInfo}>
            <h2 className={styles.chatTitle}>{title}</h2>
            <p className={`${styles.chatMeta} ${(typingUsers[chat.id] ?? []).length > 0 ? styles.typing : ''}`}>
              {subtitle}
            </p>
          </div>
        </button>
        <div className={styles.headerActions}>
          <button className={styles.headerBtn} title="Звонок" aria-label="Звонок">
            <Icon.Phone size={18} />
          </button>
          <button className={styles.headerBtn} title="Видео" aria-label="Видео">
            <Icon.Video size={18} />
          </button>
          <button className={styles.headerBtn} title="Ещё" aria-label="Ещё">
            <Icon.More size={18} />
          </button>
        </div>
      </div>

      <div className={styles.messages} ref={scrollContainerRef}>
        {loadingMore[chat.id] && (
          <div className={styles.loadingMore}>Загрузка…</div>
        )}
        {chatMessages.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyBadge}><Icon.Brand size={26} /></div>
            <p className={styles.emptyTitle}>Начните беседу</p>
            <p className={styles.emptySubtitle}>Напишите первое сообщение — оно появится здесь.</p>
          </div>
        )}

        {chatMessages.map((msg, i) => {
          const isOwn = msg.senderName === auth?.userName
          const isSystem = msg.senderName === 'System'
          const prevMsg = chatMessages[i - 1]
          const isContinuation = prevMsg && prevMsg.senderName === msg.senderName
          const showUnreadDivider = firstUnreadId === msg.id
          const isEdited = !!msg.editedAt
          const isOptimistic = msg.id.startsWith('optimistic-')
          const canModerate = chat.type === 'Group' ? chat.myRole === 'Owner'
            : chat.type === 'Channel' ? chat.myRole === 'Admin'
            : false
          const canEdit = isOwn && !isOptimistic && msg.payload.type === 'text'
          const canDelete = !isOptimistic && (isOwn || canModerate)
          const showActions = canEdit || canDelete
          const showReadMark = isOwn && !isOptimistic && chat.type === 'Private'
          const readByOther = showReadMark ? isReadByOther(msg) : false

          if (isSystem) {
            return (
              <div key={msg.id} className={styles.systemMsg}>
                {msg.payload.type === 'text' ? msg.payload.text : ''}
              </div>
            )
          }

          const showAvatar = !isOwn && (chat.type === 'Group' || chat.type === 'Channel')
          const isClusterStart = !isContinuation || showUnreadDivider

          return (
            <Fragment key={msg.id}>
              {showUnreadDivider && (
                <div
                  ref={unreadDividerRef}
                  className={styles.unreadDivider}
                  aria-label="Непрочитанные сообщения"
                >
                  <span>Непрочитанные сообщения</span>
                </div>
              )}
              <div
                className={`${styles.msgRow} ${isOwn ? styles.own : ''} ${isContinuation && !showUnreadDivider ? styles.continuation : ''}`}
              >
                {showAvatar && (
                  <div className={styles.msgAvatarCol}>
                    {isClusterStart
                      ? <Avatar name={msg.senderName} size={28} src={msg.senderAvatarUrl} />
                      : <span className={styles.msgAvatarSpacer} />
                    }
                  </div>
                )}
                <div className={`${styles.msgBody} ${isOwn ? styles.msgBodyOwn : ''}`}>
                  {!isOwn && isClusterStart && (chat.type === 'Group' || chat.type === 'Channel') && (
                    <span className={styles.senderName}>{msg.senderName}</span>
                  )}
                  <div
                    className={styles.bubble}
                    onContextMenu={showActions ? (e) => openContextMenu(msg, e) : undefined}
                  >
                    <MessageContent payload={msg.payload} onOpenImage={setLightbox} />
                    <span className={styles.bubbleTime}>
                      {isEdited && <span className={styles.editedTag}>изм.</span>}
                      {formatTime(msg.sentAt)}
                      {isOptimistic && isOwn && (
                        <span className={styles.pendingMark} aria-label="Отправляется">
                          <Icon.Clock size={11} />
                        </span>
                      )}
                      {showReadMark && (
                        <span className={`${styles.readMark} ${readByOther ? styles.readDouble : ''}`} aria-label={readByOther ? 'Прочитано' : 'Отправлено'}>
                          {readByOther ? <Icon.CheckDouble size={12} /> : <Icon.Check size={12} />}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </Fragment>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {chat.type === 'Channel' && chat.myRole === 'Subscriber' ? (
        <div className={styles.readOnlyNotice}>
          <Icon.Lock size={14} />
          Только чтение — вы подписчик этого канала
        </div>
      ) : (
        <MessageInput
          onSend={sendMessage}
          chatId={chat.id}
          editTarget={editTarget}
          onCancelEdit={() => setEditTarget(null)}
          onSubmitEdit={handleSubmitEdit}
        />
      )}
      {lightbox && (
        <ImageLightbox
          url={lightbox.url}
          fileName={lightbox.fileName}
          fileSize={lightbox.fileSize}
          onClose={() => setLightbox(null)}
        />
      )}
      {contextMenu && (() => {
        const msg = contextMenu.message
        const isOwn = msg.senderName === auth?.userName
        const canEdit = isOwn && !msg.id.startsWith('optimistic-') && msg.payload.type === 'text'
        const isModerator = chat.type === 'Group' ? chat.myRole === 'Owner'
          : chat.type === 'Channel' ? chat.myRole === 'Admin'
          : false
        const canDelete = !msg.id.startsWith('optimistic-') && (isOwn || isModerator)
        return (
          <>
            <div className={styles.menuBackdrop} onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null) }} />
            <div
              ref={menuRef}
              className={styles.bubbleMenu}
              role="menu"
              style={{
                position: 'fixed',
                top: menuPos?.y ?? contextMenu.y,
                left: menuPos?.x ?? contextMenu.x,
                visibility: menuPos ? 'visible' : 'hidden',
              }}
            >
              {canEdit && (
                <button
                  type="button"
                  className={styles.bubbleMenuItem}
                  onClick={() => handleStartEdit(msg)}
                >
                  <Icon.Edit size={14} /> Редактировать
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className={`${styles.bubbleMenuItem} ${styles.danger}`}
                  onClick={() => handleDelete(msg)}
                >
                  <Icon.Trash size={14} /> Удалить
                </button>
              )}
            </div>
          </>
        )
      })()}
    </div>
  )
}
