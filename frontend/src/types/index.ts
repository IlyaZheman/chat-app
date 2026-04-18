export interface Chat {
  id: string
  type: 'Private' | 'Group'
  name: string | null
  createdAt: string
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
