import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetChatsStore } from '../store/chatsStore'
import { initSignalR } from '../store/signalRInit'
import { useChatsListStore } from '../store/useChatsListStore'
import { useMessagesStore } from '../store/useMessagesStore'
import { useAuthStore } from '../store/authStore'
import { chatHub } from '../hub/chatHub'
import { usersApi } from '../api/usersApi'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import DetailsPanel from '../components/DetailsPanel'
import { Icon } from '../components/chatIcons'
import styles from './ChatsPage.module.css'

const BASE_TITLE = 'Chat'

export default function ChatsPage() {
  const navigate = useNavigate()
  const { setAuth, clearAuth } = useAuthStore()
  const { chats, loadChats } = useChatsListStore()
  const activeChatId = useMessagesStore(s => s.activeChatId)

  const activeChat = chats.find(c => c.id === activeChatId) ?? null

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    if (!activeChatId) setSidebarOpen(true)
  }, [activeChatId])

  const handleChatOpen = () => setSidebarOpen(false)
  const handleBackToList = () => setSidebarOpen(true)
  const toggleDetails = () => setDetailsOpen(o => !o)
  const closeDetails = () => setDetailsOpen(false)

  const detailsVisible = detailsOpen && !!activeChat

  useEffect(() => {
    const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)
    document.title = totalUnread > 0 ? `(${totalUnread > 99 ? '99+' : totalUnread}) ${BASE_TITLE}` : BASE_TITLE
    return () => { document.title = BASE_TITLE }
  }, [chats])

  useEffect(() => {
    const init = async () => {
      try {
        const freshAuth = await usersApi.me()
        setAuth(freshAuth)
      } catch {
        clearAuth()
        navigate('/login')
        return
      }

      initSignalR()

      if (!chatHub.isConnected) {
        await chatHub.connect()
      }

      await loadChats()
    }

    init()
  }, [])

  const handleLogout = async () => {
    try {
      await usersApi.logout()
    } catch {
      /* server-side cookie already gone or unreachable; proceed locally */
    }
    await chatHub.disconnect()
    resetChatsStore()
    clearAuth()
    navigate('/login')
  }

  return (
    <div
      className={styles.layout}
      data-sidebar-open={sidebarOpen}
      data-details-open={detailsVisible}
    >
      <ChatList onLogout={handleLogout} onChatOpen={handleChatOpen} />

      <main className={styles.main}>
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            onBack={handleBackToList}
            onToggleDetails={toggleDetails}
            detailsOpen={detailsVisible}
          />
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.placeholderInner}>
              <div className={styles.placeholderIconWrap}>
                <Icon.Brand size={28} />
              </div>
              <h2 className={styles.placeholderTitle}>Выберите чат</h2>
              <p className={styles.placeholderText}>
                Откройте беседу из списка слева или создайте новую
              </p>
            </div>
          </div>
        )}
      </main>

      {detailsVisible && <DetailsPanel chat={activeChat} onClose={closeDetails} />}
    </div>
  )
}
