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

  // Вызывается один раз при монтировании ChatsPage.
  // Используем get() внутри handler-а — он всегда возвращает актуальное состояние,
  // в отличие от замыкания над переменной из useEffect.
  initSignalR: () => {
    // Защита от двойного вызова (React StrictMode монтирует дважды)
    if (chatHub.handlers.size > 0) {
      console.log('[Store] initSignalR already initialized — skip')
      return
    }
    console.log('[Store] initSignalR called')
    chatHub.onReceiveMessage((senderName, text) => {
      const chatId = get().activeChatId
      console.log('[Store] handler fired:', { senderName, text, chatId })
      if (!chatId) {
        console.warn('[Store] activeChatId is null — message dropped')
        return
      }

      const msg: Message = {
        id: crypto.randomUUID(),
        senderId: senderName,
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
    await chatHub.sendMessage(text)
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