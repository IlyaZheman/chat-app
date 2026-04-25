import api from './client'
import type { Chat, Message } from '../types'

export const chatsApi = {
  getChats: () =>
    api.get<Chat[]>('/chats').then(r => r.data),

  getMessages: (chatId: string) =>
    api.get<Message[]>(`/chats/${chatId}/messages`).then(r =>
      r.data.map(m => ({ ...m, payload: m.payload ?? { type: 'text' as const, text: '' } }))
    ),

  createGroupChat: (name: string) =>
    api.post<{ chatId: string }>('/chats/group', { name }).then(r => r.data),

  getOrCreatePrivateChat: (targetUserId: string) =>
    api.post<{ chatId: string }>('/chats/private', { targetUserId }).then(r => r.data),

  getAllGroups: () =>
    api.get<Chat[]>('/chats/groups').then(r => r.data),

  joinGroup: (chatId: string) =>
    api.post(`/chats/${chatId}/join`).then(r => r.data),
}
