import { create } from 'zustand'
import { chatHub } from '../hub/chatHub'

const TYPING_CLEAR_MS = 8000
const typingTimers: Record<string, ReturnType<typeof setTimeout>> = {}

interface PresenceStore {
  onlineStatus: Record<string, boolean>
  onlineCounts: Record<string, { online: number; members: number }>
  typingUsers: Record<string, string[]>

  notifyStartTyping: (chatId: string) => void
  notifyStopTyping: (chatId: string) => void
  setOnlineStatus: (userId: string, isOnline: boolean) => void
  setOnlineCount: (chatId: string, online: number, members: number) => void
  setTyping: (chatId: string, userName: string, isTyping: boolean) => void
  removeChat: (chatId: string) => void
}

export const usePresenceStore = create<PresenceStore>((set) => ({
  onlineStatus: {},
  onlineCounts: {},
  typingUsers: {},

  notifyStartTyping: (chatId) => chatHub.startTyping(chatId),
  notifyStopTyping: (chatId) => chatHub.stopTyping(chatId),

  setOnlineStatus: (userId, isOnline) =>
    set(s => ({ onlineStatus: { ...s.onlineStatus, [userId]: isOnline } })),

  setOnlineCount: (chatId, online, members) =>
    set(s => ({ onlineCounts: { ...s.onlineCounts, [chatId]: { online, members } } })),

  setTyping: (chatId, userName, isTyping) => {
    const timerKey = `${chatId}:${userName}`
    clearTimeout(typingTimers[timerKey])
    delete typingTimers[timerKey]

    if (isTyping) {
      typingTimers[timerKey] = setTimeout(() => {
        usePresenceStore.getState().setTyping(chatId, userName, false)
      }, TYPING_CLEAR_MS)

      set(s => {
        const current = s.typingUsers[chatId] ?? []
        if (current.includes(userName)) return s
        return { typingUsers: { ...s.typingUsers, [chatId]: [...current, userName] } }
      })
    } else {
      set(s => {
        const current = s.typingUsers[chatId] ?? []
        const updated = current.filter(u => u !== userName)
        return { typingUsers: { ...s.typingUsers, [chatId]: updated } }
      })
    }
  },

  removeChat: (chatId) =>
    set(s => {
      const { [chatId]: _onlineCount, ...restOnlineCounts } = s.onlineCounts
      const { [chatId]: _typing, ...restTyping } = s.typingUsers
      return { onlineCounts: restOnlineCounts, typingUsers: restTyping }
    }),
}))

export function resetPresenceTimers() {
  Object.keys(typingTimers).forEach(k => { clearTimeout(typingTimers[k]); delete typingTimers[k] })
}
