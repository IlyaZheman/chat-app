export interface User {
  id: string
  userName: string
  email: string
}

export interface Chat {
  id: string
  type: 'Private' | 'Group'
  name: string | null
  createdAt: string
}

export interface Message {
  id: string
  senderId: string
  text: string
  sentAt: string
}

export interface AuthState {
  userId: string
  userName: string
}
