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

export type MessagePayload =
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; fileName: string; caption?: string; captionPosition?: 'above' | 'below' }
  | { type: 'file'; url: string; fileName: string; mediaType: string }

export interface Message {
  id: string
  senderName: string
  sentAt: string
  payload: MessagePayload
}

export interface AuthState {
  userId: string
  userName: string
}
