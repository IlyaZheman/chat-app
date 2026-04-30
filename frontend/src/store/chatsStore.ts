import { useChatsListStore } from './useChatsListStore'
import { useMessagesStore } from './useMessagesStore'
import { usePresenceStore, resetPresenceTimers } from './usePresenceStore'
import { useReadReceiptsStore } from './useReadReceiptsStore'
import { resetMarkReadState } from './markReadScheduler'
import { resetSignalRState } from './signalRInit'

export function resetChatsStore() {
  resetSignalRState()
  resetPresenceTimers()
  resetMarkReadState()
  useChatsListStore.setState({ chats: [], availableGroups: [], loading: false })
  useMessagesStore.setState({
    messages: {}, hasMore: {}, loadingMore: {}, firstUnreadIds: {}, activeChatId: null,
  })
  usePresenceStore.setState({ onlineStatus: {}, onlineCounts: {}, typingUsers: {} })
  useReadReceiptsStore.setState({ lastReadByUser: {} })
}

export { useChatsListStore } from './useChatsListStore'
export { useMessagesStore } from './useMessagesStore'
export { usePresenceStore } from './usePresenceStore'
export { useReadReceiptsStore } from './useReadReceiptsStore'
export { initSignalR } from './signalRInit'
