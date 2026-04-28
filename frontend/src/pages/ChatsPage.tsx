import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatsStore } from '../store/chatsStore'
import { useAuthStore } from '../store/authStore'
import { chatHub } from '../hub/chatHub'
import { usersApi } from '../api/usersApi'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import DetailsPanel from '../components/DetailsPanel'
import { Icon } from '../components/chatIcons'
import styles from './ChatsPage.module.css'

export default function ChatsPage() {
  const navigate = useNavigate()
  const { setAuth, clearAuth } = useAuthStore()
  const { chats, activeChatId, loadChats } = useChatsStore()

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
    const init = async () => {
      try {
        const freshAuth = await usersApi.me()
        setAuth(freshAuth)
      } catch {
        clearAuth()
        navigate('/login')
        return
      }

      useChatsStore.getState().initSignalR()

      if (!chatHub.isConnected) {
        await chatHub.connect()
      }

      await loadChats()
    }

    init()
  }, [])

  const handleLogout = async () => {
    await chatHub.disconnect()
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
