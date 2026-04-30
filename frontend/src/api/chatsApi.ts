import api from './client'
import type { Chat, GroupChat, ChannelChat, Message, MessagesPageResponse } from '../types'

export const chatsApi = {
  getChats: () =>
    api.get<Chat[]>('/chats').then(r => r.data),

  getMessages: (chatId: string, before?: string, around?: string) =>
    api.get<MessagesPageResponse>(`/chats/${chatId}/messages`, {
      params: around ? { around } : before ? { before } : undefined,
    }).then(r => r.data),

  createGroupChat: (name: string) =>
    api.post<{ chatId: string }>('/chats/group', { name }).then(r => r.data),

  createChannel: (name: string) =>
    api.post<{ chatId: string }>('/chats/channel', { name }).then(r => r.data),

  getOrCreatePrivateChat: (targetUserId: string) =>
    api.post<{ chatId: string }>('/chats/private', { targetUserId }).then(r => r.data),

  getAllGroups: () =>
    api.get<(GroupChat | ChannelChat)[]>('/chats/groups').then(r => r.data),

  joinGroup: (chatId: string) =>
    api.post(`/chats/${chatId}/join`).then(r => r.data),

  markRead: (chatId: string) =>
    api.post(`/chats/${chatId}/read`),

  editMessage: (chatId: string, messageId: string, text: string) =>
    api.patch<Message>(`/chats/${chatId}/messages/${messageId}`, { text }).then(r => r.data),

  deleteMessage: (chatId: string, messageId: string) =>
    api.delete(`/chats/${chatId}/messages/${messageId}`),

  muteChat: (chatId: string, mutedUntil: string | null) =>
    api.post(`/chats/${chatId}/mute`, { mutedUntil }),
}
