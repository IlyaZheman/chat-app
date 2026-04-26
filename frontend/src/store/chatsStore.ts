import { create } from 'zustand'
import type { Chat, Message, MessagePayload } from '../types'
import { chatsApi } from '../api/chatsApi'
import { chatHub, type SendMessageRequest } from '../hub/chatHub'

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

      const existing = get().messages[chatId] ?? []
      const now = Date.now()

      const isDuplicate = existing.some(m =>
        m.senderName === senderName &&
        payloadsMatch(m.payload, payload) &&
        now - new Date(m.sentAt).getTime() < 2000 &&
        m.id.startsWith('optimistic-')
      )

      if (isDuplicate) {
        set(s => ({
          messages: {
            ...s.messages,
            [chatId]: (s.messages[chatId] ?? []).map(m =>
              m.id.startsWith('optimistic-') && m.senderName === senderName && payloadsMatch(m.payload, payload)
                ? { ...m, id: crypto.randomUUID() }
                : m
            ),
          },
        }))
        return
      }

      const msg: Message = {
        id: crypto.randomUUID(),
        senderName,
        payload,
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

  sendMessage: async (payload) => {
    const chatId = get().activeChatId
    const auth = await import('../store/authStore').then(m => m.useAuthStore.getState().auth)
    if (!chatId || !auth) return

    const optimisticMsg: Message = {
      id: `optimistic-${crypto.randomUUID()}`,
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
      await chatHub.sendMessage(payloadToRequest(payload))
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

function payloadToRequest(payload: MessagePayload): SendMessageRequest {
  switch (payload.type) {
    case 'text':
      return { text: payload.text }
    case 'image':
      return { url: payload.url, fileName: payload.fileName, mediaType: payload.mediaType, caption: payload.caption, captionPosition: payload.captionPosition, fileSize: payload.fileSize }
    case 'file':
      return { url: payload.url, fileName: payload.fileName, mediaType: payload.mediaType, fileSize: payload.fileSize }
  }
}

function payloadsMatch(a: MessagePayload, b: MessagePayload): boolean {
  if (a.type !== b.type) return false
  if (a.type === 'text' && b.type === 'text') return a.text === b.text
  if (a.type === 'image' && b.type === 'image') return a.url === b.url
  if (a.type === 'file' && b.type === 'file') return a.url === b.url
  return false
}
