import * as signalR from '@microsoft/signalr'
import type { MessagePayload } from '../types'

export interface SendMessageRequest {
  text?: string | null
  url?: string | null
  fileName?: string | null
  mediaType?: string | null
  caption?: string | null
  captionPosition?: string
}

type MessageHandler = (userName: string, payload: MessagePayload) => void
type VoidHandler = () => void

class ChatHub {
  readonly handlers: Set<MessageHandler> = new Set()
  private connection: signalR.HubConnection | null = null
  private readonly newChatHandlers: Set<VoidHandler> = new Set()

  get isConnected() {
    return this.connection?.state === signalR.HubConnectionState.Connected
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

    await this.connection.start()
  }

  async disconnect() {
    this.handlers.clear()
    await this.connection?.stop()
    this.connection = null
  }

  async joinChat(chatId: string) {
    await this.connection?.invoke('JoinChat', chatId)
  }

  async leaveGroupChat() {
    await this.connection?.invoke('LeaveGroupChat')
  }

  async sendMessage(request: SendMessageRequest) {
    await this.connection?.invoke('SendMessage', request)
  }

  onReceiveMessage(handler: MessageHandler) {
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
}

export const chatHub = new ChatHub()