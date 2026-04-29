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
  | { type: 'image'; url: string; fileName: string; mediaType?: string; caption?: string; captionPosition?: 'above' | 'below'; fileSize?: number }
  | { type: 'file'; url: string; fileName: string; mediaType: string; fileSize?: number }

export interface Message {
  id: string
  senderName: string
  sentAt: string
  payload: MessagePayload
}

export interface AuthState {
  userId: string
  userName: string
  role: string
}
