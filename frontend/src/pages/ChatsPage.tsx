import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatsStore } from '../store/chatsStore'
import { useAuthStore } from '../store/authStore'
import { chatHub } from '../hub/chatHub'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import styles from './ChatsPage.module.css'

export default function ChatsPage() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore(s => s.clearAuth)
  const { chats, activeChatId, loadChats } = useChatsStore()

  const activeChat = chats.find(c => c.id === activeChatId) ?? null

  // Подключаемся к SignalR при монтировании — независимо от того,
  // пришёл ли пользователь через логин или уже был залогинен
  useEffect(() => {
    // initSignalR регистрируем всегда — независимо от состояния соединения
    useChatsStore.getState().initSignalR()

    if (!chatHub.isConnected) {
      console.log('[ChatsPage] Not connected — connecting...')
      chatHub.connect().then(() => {
        console.log('[ChatsPage] Connected')
        loadChats()
      })
    } else {
      console.log('[ChatsPage] Already connected')
      loadChats()
    }
  }, [loadChats])

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