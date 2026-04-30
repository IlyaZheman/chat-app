import { chatHub } from '../hub/chatHub'
import { useAuthStore } from './authStore'
import { useSettingsStore } from './settingsStore'
import { useChatsListStore, sortChatsByActivity } from './useChatsListStore'
import { useMessagesStore, reconcileServerMessage } from './useMessagesStore'
import { usePresenceStore } from './usePresenceStore'
import { useReadReceiptsStore } from './useReadReceiptsStore'
import { scheduleMarkRead } from './markReadScheduler'
import { playNotificationSound, previewText, showNotification } from '../utils/notifications'

const seenUnreadMessageIds = new Set<string>()
const seenDeletedMessageIds = new Set<string>()
const MAX_SEEN_SIZE = 500

function addSeen(set: Set<string>, id: string) {
  if (set.size >= MAX_SEEN_SIZE) set.clear()
  set.add(id)
}

export function resetSignalRState() {
  seenUnreadMessageIds.clear()
  seenDeletedMessageIds.clear()
}

function isNewerThanLast(last: { sentAt: string } | undefined, sentAt: string): boolean {
  if (!last) return true
  return new Date(sentAt).getTime() >= new Date(last.sentAt).getTime()
}

export function initSignalR() {
  if (chatHub.isInitialized) return

  chatHub.onNewChat(() => {
    useChatsListStore.getState().loadChats()
  })

  chatHub.onReceiveMessage((chatId, messageId, senderName, senderAvatarUrl, sentAt, payload) => {
    useChatsListStore.setState(s => ({
      chats: sortChatsByActivity(
        s.chats.map(c =>
          c.id === chatId && isNewerThanLast(c.lastMessage, sentAt)
            ? { ...c, lastMessage: { id: messageId, senderName, senderAvatarUrl, payload, sentAt } }
            : c
        )
      ),
    }))
    useMessagesStore.setState(s => ({
      messages: {
        ...s.messages,
        [chatId]: reconcileServerMessage(
          s.messages[chatId] ?? [], messageId, senderName, senderAvatarUrl, sentAt, payload
        ),
      },
    }))

    const auth = useAuthStore.getState().auth
    const isMyOwn = auth?.userName === senderName
    if (!isMyOwn && useMessagesStore.getState().activeChatId === chatId && typeof document !== 'undefined' && !document.hidden) {
      scheduleMarkRead(chatId)
    }
  })

  chatHub.onUnreadCountIncremented((chatId, messageId, senderName, senderAvatarUrl, sentAt, payload) => {
    if (seenUnreadMessageIds.has(messageId)) return
    addSeen(seenUnreadMessageIds, messageId)

    const auth = useAuthStore.getState().auth
    const isMyMessage = auth?.userName === senderName
    const activeChatId = useMessagesStore.getState().activeChatId

    useChatsListStore.setState(s => ({
      chats: sortChatsByActivity(
        s.chats.map(c => {
          if (c.id !== chatId) return c
          return {
            ...c,
            lastMessage: isNewerThanLast(c.lastMessage, sentAt)
              ? { id: messageId, senderName, senderAvatarUrl, payload, sentAt }
              : c.lastMessage,
            unreadCount: c.id !== activeChatId ? (c.unreadCount ?? 0) + 1 : c.unreadCount,
          }
        })
      ),
    }))

    if (!isMyMessage) {
      const isActive = activeChatId === chatId && typeof document !== 'undefined' && !document.hidden
      if (!isActive) {
        const chat = useChatsListStore.getState().chats.find(c => c.id === chatId)
        const isMuted = chat?.mutedUntil != null && new Date(chat.mutedUntil) > new Date()
        if (!isMuted) {
          const title = chat
            ? (chat.type === 'Group' ? `${senderName} в ${chat.name ?? 'группе'}` : senderName)
            : senderName
          showNotification({
            title,
            body: previewText(payload),
            tag: `chat-${chatId}`,
            onClick: () => { useMessagesStore.getState().selectChat(chatId).catch(() => {}) },
          })
          if (useSettingsStore.getState().soundEnabled) {
            playNotificationSound()
          }
        }
      }
    }
  })

  chatHub.onMessageUpdated((chatId, messageId, payload, editedAt) => {
    useMessagesStore.setState(s => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map(m =>
          m.id === messageId ? { ...m, payload, editedAt } : m
        ),
      },
    }))
    useChatsListStore.setState(s => ({
      chats: s.chats.map(c => {
        if (c.id !== chatId || c.lastMessage?.id !== messageId) return c
        return { ...c, lastMessage: { ...c.lastMessage, payload, editedAt } }
      }),
    }))
  })

  chatHub.onMessageDeleted((chatId, messageId, deletedAt) => {
    if (seenDeletedMessageIds.has(messageId)) return
    addSeen(seenDeletedMessageIds, messageId)
    useMessagesStore.setState(s => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map(m =>
          m.id === messageId ? { ...m, deletedAt } : m
        ),
      },
    }))
    useChatsListStore.setState(s => ({
      chats: s.chats.map(c => {
        if (c.id !== chatId || c.lastMessage?.id !== messageId) return c
        return { ...c, lastMessage: { ...c.lastMessage, deletedAt } }
      }),
    }))
  })

  chatHub.onMessageRead((chatId, userId, lastReadAt) => {
    useReadReceiptsStore.getState().updateReadAt(chatId, userId, lastReadAt)

    const auth = useAuthStore.getState().auth
    const activeChatId = useMessagesStore.getState().activeChatId
    if (auth && userId === auth.userId && chatId !== activeChatId) {
      useChatsListStore.getState().clearChatUnread(chatId)
    }
  })

  chatHub.onUserOnlineStatusChanged((userId, isOnline) => {
    usePresenceStore.getState().setOnlineStatus(userId, isOnline)
  })

  chatHub.onGroupOnlineCountChanged((chatId, onlineCount, memberCount) => {
    usePresenceStore.getState().setOnlineCount(chatId, onlineCount, memberCount)
  })

  chatHub.onChatDeleted((chatId) => {
    useChatsListStore.getState().removeChat(chatId)
    useMessagesStore.getState().removeChat(chatId)
    usePresenceStore.getState().removeChat(chatId)
    useReadReceiptsStore.getState().removeChat(chatId)
  })

  chatHub.onReconnected(() => {
    useChatsListStore.getState().loadChats()
    const activeChatId = useMessagesStore.getState().activeChatId
    if (activeChatId) {
      useMessagesStore.getState().selectChat(activeChatId).catch(() => {})
    }
  })

  chatHub.onUserTyping((chatId, userName, isTyping) => {
    usePresenceStore.getState().setTyping(chatId, userName, isTyping)
  })
}
