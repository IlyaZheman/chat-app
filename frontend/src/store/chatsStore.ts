import { create } from 'zustand'
import type { Chat, Message } from '../types'
import { chatsApi } from '../api/chatsApi'
import { chatHub } from '../hub/chatHub'

interface ChatsStore {
  chats: Chat[]
  activeChatId: string | null
  messages: Record<string, Message[]>
  loading: boolean

  loadChats: () => Promise<void>
  selectChat: (chatId: string) => Promise<void>
  sendMessage: (text: string) => Promise<void>
  createGroup: (name: string) => Promise<string>
  openPrivateChat: (targetUserId: string) => Promise<string>
  initSignalR: () => void
}

export const useChatsStore = create<ChatsStore>((set, get) => ({
  chats: [],
  activeChatId: null,
  messages: {},
  loading: false,

  initSignalR: () => {
    if (chatHub.handlers.size > 0) return

    chatHub.onNewChat(() => {
      get().loadChats()
    })

    chatHub.onReceiveMessage((senderName, text) => {
      const chatId = get().activeChatId
      if (!chatId) return

      const existing = get().messages[chatId] ?? []

      const now = Date.now()
      const isDuplicate = existing.some(m =>
        m.text === text &&
        m.senderName === senderName &&
        now - new Date(m.sentAt).getTime() < 2000 &&
        m.id.startsWith('optimistic-')
      )

      if (isDuplicate) {
        set(s => ({
          messages: {
            ...s.messages,
            [chatId]: (s.messages[chatId] ?? []).map(m =>
              m.id.startsWith('optimistic-') && m.text === text && m.senderName === senderName
                ? { ...m, id: crypto.randomUUID() }
                : m
            ),
          },
        }))
        return
      }

      const msg: Message = {
        id: crypto.randomUUID(),
        senderName: senderName,
        text,
        sentAt: new Date().toISOString(),
      }

      set(s => ({
        messages: {
          ...s.messages,
          [chatId]: [...(s.messages[chatId] ?? []), msg],
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

  sendMessage: async (text) => {
    const chatId = get().activeChatId
    const auth = await import('../store/authStore').then(m => m.useAuthStore.getState().auth)
    if (!chatId || !auth) return

    const optimisticMsg: Message = {
      id: `optimistic-${crypto.randomUUID()}`,
      senderName: auth.userName,
      text,
      sentAt: new Date().toISOString(),
    }

    set(s => ({
      messages: {
        ...s.messages,
        [chatId]: [...(s.messages[chatId] ?? []), optimisticMsg],
      },
    }))

    try {
      await chatHub.sendMessage(text)
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
}))
