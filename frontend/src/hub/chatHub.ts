import * as signalR from '@microsoft/signalr'

type MessageHandler = (userName: string, text: string) => void

class ChatHub {
  private connection: signalR.HubConnection | null = null
  readonly handlers: Set<MessageHandler> = new Set()

  async connect() {
    this.connection = new signalR.HubConnectionBuilder()
        .withUrl('/chat', { withCredentials: true })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build()

    // Один глобальный listener на соединении — раздаёт всем подписчикам.
    // Проблема оригинального кода: каждый вызов onReceiveMessage добавлял
    // ещё один listener через connection.on() — они накапливались и не чистились.
    this.connection.on('ReceiveMessage', (userName: string, text: string) => {
      this.handlers.forEach(h => h(userName, text))
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

  async sendMessage(text: string) {
    await this.connection?.invoke('SendMessage', text)
  }

  onReceiveMessage(handler: MessageHandler) {
    this.handlers.add(handler)
  }

  offReceiveMessage(handler: MessageHandler) {
    this.handlers.delete(handler)
  }

  get isConnected() {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }
}

export const chatHub = new ChatHub()