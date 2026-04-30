import { useEffect } from 'react'
import { scheduleMarkRead } from '../store/markReadScheduler'

export function useMarkRead(chatId: string | null) {
  useEffect(() => {
    if (!chatId || typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      if (!document.hidden) scheduleMarkRead(chatId)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [chatId])
}
