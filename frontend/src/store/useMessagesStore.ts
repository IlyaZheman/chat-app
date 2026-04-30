import { create } from 'zustand'
import type { Message, MessagePayload } from '../types'
import { chatsApi } from '../api/chatsApi'
import { chatHub } from '../hub/chatHub'
import { useAuthStore } from './authStore'
import { useToastStore } from './toastStore'
import { useChatsListStore } from './useChatsListStore'
import { recordMarkReadNow } from './markReadScheduler'
import { payloadsMatch } from '../utils/messagePayloadHelpers'

const OPTIMISTIC_PREFIX = 'optimistic-'
const DEDUP_WINDOW_MS = 30_000

export interface MessagesStore {
  messages: Record<string, Message[]>
  hasMore: Record<string, boolean>
  loadingMore: Record<string, boolean>
  firstUnreadIds: Record<string, string | null>
  activeChatId: string | null

  selectChat: (chatId: string) => Promise<void>
  loadMoreMessages: (chatId: string) => Promise<void>
  sendMessage: (payload: MessagePayload) => Promise<void>
  editMessage: (chatId: string, messageId: string, text: string) => Promise<void>
  deleteMessage: (chatId: string, messageId: string) => Promise<void>
  removeChat: (chatId: string) => void
}

export function reconcileServerMessage(
  messages: Message[],
  messageId: string,
  senderName: string,
  senderAvatarUrl: string | null,
  sentAt: string,
  payload: MessagePayload,
): Message[] {
  const now = Date.now()
  const matchIndex = messages.findIndex(m =>
    m.id.startsWith(OPTIMISTIC_PREFIX) &&
    m.senderName === senderName &&
    payloadsMatch(m.payload, payload) &&
    now - new Date(m.sentAt).getTime() < DEDUP_WINDOW_MS
  )

  if (matchIndex !== -1) {
    const reconciled = [...messages]
    reconciled[matchIndex] = { ...reconciled[matchIndex], id: messageId, sentAt, senderAvatarUrl }
    return reconciled
  }

  if (messages.some(m => m.id === messageId)) return messages

  const fresh: Message = { id: messageId, senderName, senderAvatarUrl, payload, sentAt }
  return [...messages, fresh]
}

export const useMessagesStore = create<MessagesStore>((set, get) => ({
  messages: {},
  hasMore: {},
  loadingMore: {},
  firstUnreadIds: {},
  activeChatId: null,

  selectChat: async (chatId) => {
    set({ activeChatId: chatId })
    useChatsListStore.getState().clearChatUnread(chatId)

    await chatHub.joinChat(chatId)
    const { messages: msgs, hasMore, firstUnreadMessageId } = await chatsApi.getMessages(chatId)

    let finalMessages = msgs
    let finalHasMore = hasMore
    if (firstUnreadMessageId && !msgs.some(m => m.id === firstUnreadMessageId)) {
      try {
        const around = await chatsApi.getMessages(chatId, undefined, firstUnreadMessageId)
        finalMessages = around.messages
        finalHasMore = around.hasMore
      } catch {
        /* fall back to last page */
      }
    }

    set(s => ({
      messages: { ...s.messages, [chatId]: finalMessages },
      hasMore: { ...s.hasMore, [chatId]: finalHasMore },
      firstUnreadIds: { ...s.firstUnreadIds, [chatId]: firstUnreadMessageId ?? null },
    }))
    recordMarkReadNow(chatId)
    chatsApi.markRead(chatId).catch(() => {})
  },

  loadMoreMessages: async (chatId) => {
    const s = get()
    if (s.loadingMore[chatId] || !s.hasMore[chatId]) return
    const cursor = s.messages[chatId]?.[0]?.id
    if (!cursor) return

    set(s2 => ({ loadingMore: { ...s2.loadingMore, [chatId]: true } }))
    try {
      const { messages: older, hasMore } = await chatsApi.getMessages(chatId, cursor)
      set(s2 => {
        const combined = [...older, ...(s2.messages[chatId] ?? [])]
        const trimmed = combined.length > 150 ? combined.slice(combined.length - 150) : combined
        return {
          messages: { ...s2.messages, [chatId]: trimmed },
          hasMore: { ...s2.hasMore, [chatId]: combined.length > 150 ? true : hasMore },
          loadingMore: { ...s2.loadingMore, [chatId]: false },
        }
      })
    } catch {
      set(s2 => ({ loadingMore: { ...s2.loadingMore, [chatId]: false } }))
    }
  },

  sendMessage: async (payload) => {
    const chatId = get().activeChatId
    const auth = useAuthStore.getState().auth
    if (!chatId || !auth) return

    const optimisticMsg: Message = {
      id: `${OPTIMISTIC_PREFIX}${crypto.randomUUID()}`,
      senderName: auth.userName,
      payload,
      sentAt: new Date().toISOString(),
    }

    set(s => ({
      messages: { ...s.messages, [chatId]: [...(s.messages[chatId] ?? []), optimisticMsg] },
    }))

    try {
      await chatHub.sendMessage(payload)
    } catch {
      set(s => ({
        messages: {
          ...s.messages,
          [chatId]: (s.messages[chatId] ?? []).filter(m => m.id !== optimisticMsg.id),
        },
      }))
      useToastStore.getState().show('Не удалось отправить сообщение')
    }
  },

  editMessage: async (chatId, messageId, text) => {
    const updated = await chatsApi.editMessage(chatId, messageId, text)
    set(s => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map(m =>
          m.id === messageId ? { ...m, payload: updated.payload, editedAt: updated.editedAt } : m
        ),
      },
    }))
    useChatsListStore.setState(s => ({
      chats: s.chats.map(c => {
        if (c.id !== chatId || c.lastMessage?.id !== messageId) return c
        return { ...c, lastMessage: { ...c.lastMessage, payload: updated.payload, editedAt: updated.editedAt } }
      }),
    }))
  },

  deleteMessage: async (chatId, messageId) => {
    await chatsApi.deleteMessage(chatId, messageId)
    const now = new Date().toISOString()
    set(s => ({
      messages: {
        ...s.messages,
        [chatId]: (s.messages[chatId] ?? []).map(m =>
          m.id === messageId ? { ...m, deletedAt: now } : m
        ),
      },
    }))
    useChatsListStore.setState(s => ({
      chats: s.chats.map(c => {
        if (c.id !== chatId || c.lastMessage?.id !== messageId) return c
        return { ...c, lastMessage: { ...c.lastMessage, deletedAt: now } }
      }),
    }))
  },

  removeChat: (chatId) =>
    set(s => {
      const { [chatId]: _msgs, ...restMessages } = s.messages
      const { [chatId]: _hasMore, ...restHasMore } = s.hasMore
      const { [chatId]: _loading, ...restLoading } = s.loadingMore
      const { [chatId]: _firstUnread, ...restFirstUnread } = s.firstUnreadIds
      return {
        activeChatId: s.activeChatId === chatId ? null : s.activeChatId,
        messages: restMessages,
        hasMore: restHasMore,
        loadingMore: restLoading,
        firstUnreadIds: restFirstUnread,
      }
    }),
}))

export const selectChatMessages = (chatId: string) => (s: MessagesStore) =>
  (s.messages[chatId] ?? []).filter((m) => !m.deletedAt)
