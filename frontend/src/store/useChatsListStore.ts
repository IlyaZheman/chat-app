import { create } from 'zustand'
import type { Chat, GroupChat, ChannelChat } from '../types'
import { chatsApi } from '../api/chatsApi'
import { usePresenceStore } from './usePresenceStore'

export interface ChatsListStore {
  chats: Chat[]
  availableGroups: (GroupChat | ChannelChat)[]
  loading: boolean

  loadChats: () => Promise<void>
  loadAllGroups: () => Promise<void>
  createGroup: (name: string) => Promise<string>
  createChannel: (name: string) => Promise<string>
  openPrivateChat: (targetUserId: string) => Promise<string>
  joinGroup: (chatId: string) => Promise<void>
  muteChat: (chatId: string, mutedUntil: string | null) => Promise<void>
  clearChatUnread: (chatId: string) => void
  removeChat: (chatId: string) => void
}

function chatActivityTime(chat: Chat): number {
  const ref = chat.lastMessage?.sentAt ?? chat.createdAt
  return new Date(ref).getTime()
}

export function sortChatsByActivity(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => chatActivityTime(b) - chatActivityTime(a))
}

export const useChatsListStore = create<ChatsListStore>((set, get) => ({
  chats: [],
  availableGroups: [],
  loading: false,

  loadChats: async () => {
    set({ loading: true })
    const chats = await chatsApi.getChats()

    const onlineStatus: Record<string, boolean> = {}
    const onlineCounts: Record<string, { online: number; members: number }> = {}
    for (const chat of chats) {
      if (chat.type === 'Private' && chat.otherUserId) {
        onlineStatus[chat.otherUserId] = chat.isOnline ?? false
      } else if (chat.type === 'Group' || chat.type === 'Channel') {
        onlineCounts[chat.id] = {
          online: chat.onlineCount ?? 0,
          members: chat.memberCount ?? 0,
        }
      }
    }

    set({ chats: sortChatsByActivity(chats), loading: false })
    usePresenceStore.setState(s => ({
      onlineStatus: { ...s.onlineStatus, ...onlineStatus },
      onlineCounts: { ...s.onlineCounts, ...onlineCounts },
    }))
  },

  loadAllGroups: async () => {
    const groups = await chatsApi.getAllGroups()
    set({ availableGroups: groups })
  },

  createGroup: async (name) => {
    const { chatId } = await chatsApi.createGroupChat(name)
    await get().loadChats()
    return chatId
  },

  createChannel: async (name) => {
    const { chatId } = await chatsApi.createChannel(name)
    await get().loadChats()
    return chatId
  },

  openPrivateChat: async (targetUserId) => {
    const { chatId } = await chatsApi.getOrCreatePrivateChat(targetUserId)
    await get().loadChats()
    return chatId
  },

  joinGroup: async (chatId) => {
    await chatsApi.joinGroup(chatId)
    await get().loadChats()
  },

  muteChat: async (chatId, mutedUntil) => {
    await chatsApi.muteChat(chatId, mutedUntil)
    set(s => ({
      chats: s.chats.map(c => c.id === chatId ? { ...c, mutedUntil } : c),
    }))
  },

  clearChatUnread: (chatId) =>
    set(s => ({ chats: s.chats.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c) })),

  removeChat: (chatId) =>
    set(s => ({ chats: s.chats.filter(c => c.id !== chatId) })),
}))

export const selectOtherUserId = (chatId: string) => (s: ChatsListStore): string | null => {
  const chat = s.chats.find((c) => c.id === chatId)
  if (!chat || chat.type !== 'Private' || !chat.otherUserId) return null
  return chat.otherUserId
}
