export interface PrivateChat {
  type: 'Private'
  id: string
  createdAt: string
  otherUserName?: string
  otherUserId?: string
  otherUserAvatarUrl?: string | null
  isOnline?: boolean
  lastMessage?: Message
  unreadCount?: number
  mutedUntil?: string | null
}

export interface GroupChat {
  type: 'Group'
  id: string
  name: string | null
  createdAt: string
  myRole?: string
  memberCount?: number
  onlineCount?: number
  lastMessage?: Message
  unreadCount?: number
  mutedUntil?: string | null
}

export interface ChannelChat {
  type: 'Channel'
  id: string
  name: string | null
  createdAt: string
  myRole?: string
  memberCount?: number
  onlineCount?: number
  lastMessage?: Message
  unreadCount?: number
  mutedUntil?: string | null
}

export type Chat = PrivateChat | GroupChat | ChannelChat

export interface MessagesPageResponse {
  messages: Message[]
  hasMore: boolean
  firstUnreadMessageId: string | null
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
  senderAvatarUrl?: string | null
  sentAt: string
  payload: MessagePayload
  editedAt?: string | null
  deletedAt?: string | null
}

export interface AuthState {
  userId: string
  userName: string
  role: string
  avatarUrl?: string | null
}
