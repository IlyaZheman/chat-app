import * as signalR from '@microsoft/signalr'
import type { MessagePayload } from '../types'

type MessageHandler = (chatId: string, messageId: string, userName: string, senderAvatarUrl: string | null, sentAt: string, payload: MessagePayload) => void
type UnreadCountIncrementedHandler = (chatId: string, messageId: string, senderName: string, senderAvatarUrl: string | null, sentAt: string, payload: MessagePayload) => void
type MessageUpdatedHandler = (chatId: string, messageId: string, payload: MessagePayload, editedAt: string) => void
type MessageDeletedHandler = (chatId: string, messageId: string, deletedAt: string) => void
type MessageReadHandler = (chatId: string, userId: string, lastReadAt: string) => void
type VoidHandler = () => void
type OnlineStatusHandler = (userId: string, isOnline: boolean) => void
type GroupOnlineCountHandler = (chatId: string, onlineCount: number, memberCount: number) => void
type TypingHandler = (chatId: string, userName: string, isTyping: boolean) => void
type ChatDeletedHandler = (chatId: string) => void

class ChatHub {
  private readonly handlers: Set<MessageHandler> = new Set()
  private readonly newChatHandlers: Set<VoidHandler> = new Set()
  private readonly onlineStatusHandlers: Set<OnlineStatusHandler> = new Set()
  private readonly groupOnlineCountHandlers: Set<GroupOnlineCountHandler> = new Set()
  private readonly typingHandlers: Set<TypingHandler> = new Set()
  private readonly unreadCountIncrementedHandlers: Set<UnreadCountIncrementedHandler> = new Set()
  private readonly messageUpdatedHandlers: Set<MessageUpdatedHandler> = new Set()
  private readonly messageDeletedHandlers: Set<MessageDeletedHandler> = new Set()
  private readonly messageReadHandlers: Set<MessageReadHandler> = new Set()
  private readonly reconnectedHandlers: Set<VoidHandler> = new Set()
  private readonly chatDeletedHandlers: Set<ChatDeletedHandler> = new Set()
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

    this.connection.on('ReceiveMessage', (chatId: string, messageId: string, userName: string, senderAvatarUrl: string | null, sentAt: string, payload: MessagePayload) => {
      this.handlers.forEach(h => h(chatId, messageId, userName, senderAvatarUrl, sentAt, payload))
    })

    this.connection.on('UnreadCountIncremented', (chatId: string, messageId: string, senderName: string, senderAvatarUrl: string | null, sentAt: string, payload: MessagePayload) => {
      this.unreadCountIncrementedHandlers.forEach(h => h(chatId, messageId, senderName, senderAvatarUrl, sentAt, payload))
    })

    this.connection.on('MessageUpdated', (chatId: string, messageId: string, payload: MessagePayload, editedAt: string) => {
      this.messageUpdatedHandlers.forEach(h => h(chatId, messageId, payload, editedAt))
    })

    this.connection.on('MessageDeleted', (chatId: string, messageId: string, deletedAt: string) => {
      this.messageDeletedHandlers.forEach(h => h(chatId, messageId, deletedAt))
    })

    this.connection.on('MessageRead', (chatId: string, userId: string, lastReadAt: string) => {
      this.messageReadHandlers.forEach(h => h(chatId, userId, lastReadAt))
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

    this.connection.on('ChatDeleted', (chatId: string) => {
      this.chatDeletedHandlers.forEach(h => h(chatId))
    })

    this.connection.onreconnected(() => {
      this.reconnectedHandlers.forEach(h => h())
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
    this.unreadCountIncrementedHandlers.clear()
    this.messageUpdatedHandlers.clear()
    this.messageDeletedHandlers.clear()
    this.messageReadHandlers.clear()
    this.reconnectedHandlers.clear()
    this.chatDeletedHandlers.clear()
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

  onUnreadCountIncremented(handler: UnreadCountIncrementedHandler) {
    this.unreadCountIncrementedHandlers.add(handler)
  }

  offUnreadCountIncremented(handler: UnreadCountIncrementedHandler) {
    this.unreadCountIncrementedHandlers.delete(handler)
  }

  onMessageUpdated(handler: MessageUpdatedHandler) {
    this.messageUpdatedHandlers.add(handler)
  }

  offMessageUpdated(handler: MessageUpdatedHandler) {
    this.messageUpdatedHandlers.delete(handler)
  }

  onMessageDeleted(handler: MessageDeletedHandler) {
    this.messageDeletedHandlers.add(handler)
  }

  offMessageDeleted(handler: MessageDeletedHandler) {
    this.messageDeletedHandlers.delete(handler)
  }

  onMessageRead(handler: MessageReadHandler) {
    this.messageReadHandlers.add(handler)
  }

  offMessageRead(handler: MessageReadHandler) {
    this.messageReadHandlers.delete(handler)
  }

  onReconnected(handler: VoidHandler) {
    this.reconnectedHandlers.add(handler)
  }

  offReconnected(handler: VoidHandler) {
    this.reconnectedHandlers.delete(handler)
  }

  onChatDeleted(handler: ChatDeletedHandler) {
    this.chatDeletedHandlers.add(handler)
  }

  offChatDeleted(handler: ChatDeletedHandler) {
    this.chatDeletedHandlers.delete(handler)
  }
}

export const chatHub = new ChatHub()
