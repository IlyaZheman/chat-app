import { create } from 'zustand'

export interface ReadReceiptsStore {
  lastReadByUser: Record<string, Record<string, string>>

  updateReadAt: (chatId: string, userId: string, lastReadAt: string) => void
  removeChat: (chatId: string) => void
}

export const useReadReceiptsStore = create<ReadReceiptsStore>((set) => ({
  lastReadByUser: {},

  updateReadAt: (chatId, userId, lastReadAt) =>
    set(s => {
      const chatMap = { ...(s.lastReadByUser[chatId] ?? {}) }
      const prev = chatMap[userId]
      if (prev && new Date(lastReadAt).getTime() <= new Date(prev).getTime()) return s
      chatMap[userId] = lastReadAt
      return { lastReadByUser: { ...s.lastReadByUser, [chatId]: chatMap } }
    }),

  removeChat: (chatId) =>
    set(s => {
      const { [chatId]: _reads, ...rest } = s.lastReadByUser
      return { lastReadByUser: rest }
    }),
}))

export const selectOtherReadAt = (chatId: string, otherUserId: string | null) => (s: ReadReceiptsStore): string | null => {
  if (!otherUserId) return null
  return (s.lastReadByUser[chatId] ?? {})[otherUserId] ?? null
}
