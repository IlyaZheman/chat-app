export interface Chat {
  id: string
  type: 'Private' | 'Group'
  name: string | null
  otherUserName?: string
  createdAt: string
}

export interface User {
  id: string
  userName: string
}

export interface Message {
  id: string
  senderName: string
  text: string
  sentAt: string
}

export interface AuthState {
  userId: string
  userName: string
}
