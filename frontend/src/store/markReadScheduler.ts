import { chatsApi } from '../api/chatsApi'

const MARK_READ_THROTTLE_MS = 1500
export const lastMarkReadAt: Record<string, number> = {}
const pendingMarkRead: Record<string, ReturnType<typeof setTimeout>> = {}

export function scheduleMarkRead(chatId: string) {
  if (pendingMarkRead[chatId]) return
  const elapsed = Date.now() - (lastMarkReadAt[chatId] ?? 0)
  const fire = () => {
    lastMarkReadAt[chatId] = Date.now()
    delete pendingMarkRead[chatId]
    chatsApi.markRead(chatId).catch(() => {})
  }
  if (elapsed >= MARK_READ_THROTTLE_MS) {
    fire()
  } else {
    pendingMarkRead[chatId] = setTimeout(fire, MARK_READ_THROTTLE_MS - elapsed)
  }
}

export function recordMarkReadNow(chatId: string) {
  lastMarkReadAt[chatId] = Date.now()
}

export function resetMarkReadState() {
  Object.keys(pendingMarkRead).forEach(k => {
    clearTimeout(pendingMarkRead[k])
    delete pendingMarkRead[k]
  })
  Object.keys(lastMarkReadAt).forEach(k => delete lastMarkReadAt[k])
}

