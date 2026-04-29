import { create } from 'zustand'
import type { Chat, Message, MessagePayload } from '../types'
import { chatsApi } from '../api/chatsApi'
import { chatHub } from '../hub/chatHub'
import { useAuthStore } from './authStore'

const TYPING_CLEAR_MS = 8000

interface ChatsStore {
  chats: Chat[]
  availableGroups: Chat[]
  activeChatId: string | null
  messages: Record<string, Message[]>
  loading: boolean
  onlineStatus: Record<string, boolean>
  onlineCounts: Record<string, { online: number; members: number }>
  typingUsers: Record<string, string[]>

  loadChats: () => Promise<void>
  loadAllGroups: () => Promise<void>
  selectChat: (chatId: string) => Promise<void>
  sendMessage: (payload: MessagePayload) => Promise<void>
  createGroup: (name: string) => Promise<string>
  openPrivateChat: (targetUserId: string) => Promise<string>
  joinGroup: (chatId: string) => Promise<void>
  initSignalR: () => void
  notifyStartTyping: (chatId: string) => void
  notifyStopTyping: (chatId: string) => void
}

const typingTimers: Record<string, ReturnType<typeof setTimeout>> = {}

export const useChatsStore = create<ChatsStore>((set, get) => ({
  chats: [],
  availableGroups: [],
  activeChatId: null,
  messages: {},
  loading: false,
  onlineStatus: {},
  onlineCounts: {},
  typingUsers: {},

  initSignalR: () => {
    if (chatHub.isInitialized) return

    chatHub.onNewChat(() => {
      get().loadChats()
    })

    chatHub.onReceiveMessage((chatId, senderName, payload) => {
      set(s => ({
        messages: {
          ...s.messages,
          [chatId]: reconcileServerMessage(s.messages[chatId] ?? [], senderName, payload),
        },
      }))
    })

    chatHub.onUserOnlineStatusChanged((userId, isOnline) => {
      set(s => ({ onlineStatus: { ...s.onlineStatus, [userId]: isOnline } }))
    })

    chatHub.onGroupOnlineCountChanged((chatId, onlineCount, memberCount) => {
      set(s => ({
        onlineCounts: { ...s.onlineCounts, [chatId]: { online: onlineCount, members: memberCount } },
      }))
    })

    chatHub.onUserTyping((chatId, userName, isTyping) => {
      const timerKey = `${chatId}:${userName}`

      if (isTyping) {
        clearTimeout(typingTimers[timerKey])
        typingTimers[timerKey] = setTimeout(() => {
          removeTypingUser(chatId, userName)
          delete typingTimers[timerKey]
        }, TYPING_CLEAR_MS)

        set(s => {
          const current = s.typingUsers[chatId] ?? []
          if (current.includes(userName)) return s
          return { typingUsers: { ...s.typingUsers, [chatId]: [...current, userName] } }
        })
      } else {
        clearTimeout(typingTimers[timerKey])
        delete typingTimers[timerKey]
        removeTypingUser(chatId, userName)
      }
    })
  },

  loadChats: async () => {
    set({ loading: true })
    const chats = await chatsApi.getChats()

    const onlineStatus: Record<string, boolean> = {}
    const onlineCounts: Record<string, { online: number; members: number }> = {}
    for (const chat of chats) {
      if (chat.type === 'Private' && chat.otherUserId) {
        onlineStatus[chat.otherUserId] = chat.isOnline ?? false
      } else if (chat.type === 'Group') {
        onlineCounts[chat.id] = {
          online: chat.onlineCount ?? 0,
          members: chat.memberCount ?? 0,
        }
      }
    }

    set(s => ({
      chats,
      loading: false,
      onlineStatus: { ...s.onlineStatus, ...onlineStatus },
      onlineCounts: { ...s.onlineCounts, ...onlineCounts },
    }))
  },

  selectChat: async (chatId) => {
    set({ activeChatId: chatId })
    await chatHub.joinChat(chatId)
    const msgs = await chatsApi.getMessages(chatId)
    set(s => ({ messages: { ...s.messages, [chatId]: msgs } }))
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

  notifyStartTyping: (chatId) => {
    chatHub.startTyping(chatId)
  },

  notifyStopTyping: (chatId) => {
    chatHub.stopTyping(chatId)
  },
}))

function removeTypingUser(chatId: string, userName: string) {
  useChatsStore.setState(s => {
    const current = s.typingUsers[chatId] ?? []
    const updated = current.filter(u => u !== userName)
    return { typingUsers: { ...s.typingUsers, [chatId]: updated } }
  })
}

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
