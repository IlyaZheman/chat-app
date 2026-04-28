import { create } from 'zustand'
import type { Chat, Message, MessagePayload } from '../types'
import { chatsApi } from '../api/chatsApi'
import { chatHub } from '../hub/chatHub'
import { useAuthStore } from './authStore'

interface ChatsStore {
  chats: Chat[]
  availableGroups: Chat[]
  activeChatId: string | null
  messages: Record<string, Message[]>
  loading: boolean

  loadChats: () => Promise<void>
  loadAllGroups: () => Promise<void>
  selectChat: (chatId: string) => Promise<void>
  sendMessage: (payload: MessagePayload) => Promise<void>
  createGroup: (name: string) => Promise<string>
  openPrivateChat: (targetUserId: string) => Promise<string>
  joinGroup: (chatId: string) => Promise<void>
  initSignalR: () => void
}

export const useChatsStore = create<ChatsStore>((set, get) => ({
  chats: [],
  availableGroups: [],
  activeChatId: null,
  messages: {},
  loading: false,

  initSignalR: () => {
    if (chatHub.handlers.size > 0) return

    chatHub.onNewChat(() => {
      get().loadChats()
    })

    chatHub.onReceiveMessage((senderName, payload) => {
      const chatId = get().activeChatId
      if (!chatId) return

      set(s => ({
        messages: {
          ...s.messages,
          [chatId]: reconcileServerMessage(s.messages[chatId] ?? [], senderName, payload),
        },
      }))
    })
  },

  loadChats: async () => {
    set({ loading: true })
    const chats = await chatsApi.getChats()
    set({ chats, loading: false })
  },

  selectChat: async (chatId) => {
    if (!get().messages[chatId]) {
      const msgs = await chatsApi.getMessages(chatId)
      set(s => ({ messages: { ...s.messages, [chatId]: msgs } }))
    }
    set({ activeChatId: chatId })
    await chatHub.joinChat(chatId)
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
      messages: {
        ...s.messages,
        [chatId]: [...(s.messages[chatId] ?? []), optimisticMsg],
      },
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
    }
  },

  createGroup: async (name) => {
    const { chatId } = await chatsApi.createGroupChat(name)
    await get().loadChats()
    return chatId
  },

  openPrivateChat: async (targetUserId) => {
    const { chatId } = await chatsApi.getOrCreatePrivateChat(targetUserId)
    await get().loadChats()
    return chatId
  },

  loadAllGroups: async () => {
    const groups = await chatsApi.getAllGroups()
    set({ availableGroups: groups })
  },

  joinGroup: async (chatId) => {
    await chatsApi.joinGroup(chatId)
    await get().loadChats()
  },
}))

const OPTIMISTIC_PREFIX = 'optimistic-'
const DEDUP_WINDOW_MS = 2000

function payloadsMatch(a: MessagePayload, b: MessagePayload): boolean {
  if (a.type !== b.type) return false
  if (a.type === 'text' && b.type === 'text') return a.text === b.text
  if (a.type === 'image' && b.type === 'image') return a.url === b.url
  if (a.type === 'file' && b.type === 'file') return a.url === b.url
  return false
}

function reconcileServerMessage(
  messages: Message[],
  senderName: string,
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
    reconciled[matchIndex] = { ...reconciled[matchIndex], id: crypto.randomUUID() }
    return reconciled
  }

  const fresh: Message = {
    id: crypto.randomUUID(),
    senderName,
    payload,
    sentAt: new Date().toISOString(),
  }
  return [...messages, fresh]
}
