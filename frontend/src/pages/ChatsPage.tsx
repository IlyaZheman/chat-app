import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatsStore } from '../store/chatsStore'
import { useAuthStore } from '../store/authStore'
import { chatHub } from '../hub/chatHub'
import { usersApi } from '../api/usersApi'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import styles from './ChatsPage.module.css'

export default function ChatsPage() {
  const navigate = useNavigate()
  const { auth, setAuth, clearAuth } = useAuthStore()
  const { chats, activeChatId, loadChats } = useChatsStore()

  const activeChat = chats.find(c => c.id === activeChatId) ?? null

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
    <div className={styles.layout}>
      <ChatList onLogout={handleLogout} />

      <main className={styles.main}>
        {activeChat ? (
          <ChatWindow chat={activeChat} />
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.placeholderInner}>
              <span className={styles.placeholderIcon}>◈</span>
              <h2 className={styles.placeholderTitle}>Выберите чат</h2>
              <p className={styles.placeholderText}>
                Откройте чат из списка слева или создайте новый
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
