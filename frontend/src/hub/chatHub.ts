import * as signalR from '@microsoft/signalr'
import type { MessagePayload } from '../types'

type MessageHandler = (userName: string, payload: MessagePayload) => void
type VoidHandler = () => void
type OnlineStatusHandler = (userId: string, isOnline: boolean) => void
type GroupOnlineCountHandler = (chatId: string, onlineCount: number, memberCount: number) => void
type TypingHandler = (chatId: string, userName: string, isTyping: boolean) => void

class ChatHub {
  private readonly handlers: Set<MessageHandler> = new Set()
  private readonly newChatHandlers: Set<VoidHandler> = new Set()
  private readonly onlineStatusHandlers: Set<OnlineStatusHandler> = new Set()
  private readonly groupOnlineCountHandlers: Set<GroupOnlineCountHandler> = new Set()
  private readonly typingHandlers: Set<TypingHandler> = new Set()
  private connection: signalR.HubConnection | null = null
  private initialized = false

  get isConnected() {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }

  get isInitialized() {
    return this.initialized
  }

  async connect() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('/chat', { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build()

    this.connection.on('ReceiveMessage', (userName: string, payload: MessagePayload) => {
      this.handlers.forEach(h => h(userName, payload))
    })

    this.connection.on('NewChatCreated', () => {
      this.newChatHandlers.forEach(h => h())
    })

    this.connection.on('UserOnlineStatusChanged', (userId: string, isOnline: boolean) => {
      this.onlineStatusHandlers.forEach(h => h(userId, isOnline))
    })

    this.connection.on('GroupOnlineCountChanged', (chatId: string, onlineCount: number, memberCount: number) => {
      this.groupOnlineCountHandlers.forEach(h => h(chatId, onlineCount, memberCount))
    })

    this.connection.on('UserTyping', (chatId: string, userName: string, isTyping: boolean) => {
      this.typingHandlers.forEach(h => h(chatId, userName, isTyping))
    })

    await this.connection.start()
  }

  async disconnect() {
    this.initialized = false
    this.handlers.clear()
    this.newChatHandlers.clear()
    this.onlineStatusHandlers.clear()
    this.groupOnlineCountHandlers.clear()
    this.typingHandlers.clear()
    await this.connection?.stop()
    this.connection = null
  }

  async joinChat(chatId: string) {
    await this.connection?.invoke('JoinChat', chatId)
  }

  async leaveGroupChat() {
    await this.connection?.invoke('LeaveGroupChat')
  }

  async sendMessage(payload: MessagePayload) {
    await this.connection?.invoke('SendMessage', payload)
  }

  async startTyping(chatId: string) {
    await this.connection?.invoke('StartTyping', chatId)
  }

  async stopTyping(chatId: string) {
    await this.connection?.invoke('StopTyping', chatId)
  }

  onReceiveMessage(handler: MessageHandler) {
    this.initialized = true
    this.handlers.add(handler)
  }

  offReceiveMessage(handler: MessageHandler) {
    this.handlers.delete(handler)
  }

  onNewChat(handler: VoidHandler) {
    this.newChatHandlers.add(handler)
  }

  offNewChat(handler: VoidHandler) {
    this.newChatHandlers.delete(handler)
  }

  onUserOnlineStatusChanged(handler: OnlineStatusHandler) {
    this.onlineStatusHandlers.add(handler)
  }

  offUserOnlineStatusChanged(handler: OnlineStatusHandler) {
    this.onlineStatusHandlers.delete(handler)
  }

  onGroupOnlineCountChanged(handler: GroupOnlineCountHandler) {
    this.groupOnlineCountHandlers.add(handler)
  }

  offGroupOnlineCountChanged(handler: GroupOnlineCountHandler) {
    this.groupOnlineCountHandlers.delete(handler)
  }

  onUserTyping(handler: TypingHandler) {
    this.typingHandlers.add(handler)
  }

  offUserTyping(handler: TypingHandler) {
    this.typingHandlers.delete(handler)
  }
}

export const chatHub = new ChatHub()
