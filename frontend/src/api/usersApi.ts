import api from './client'
import type { AuthState, User } from '../types'

export const usersApi = {
  register: (userName: string, email: string, password: string) =>
    api.post('/register', { userName, email, password }),

  login: (email: string, password: string) =>
    api.post('/login', { email, password }),

  logout: () =>
    api.post('/logout'),

  me: () =>
    api.get<AuthState>('/me').then(r => r.data),

  updateProfile: (payload: { userName?: string; avatarUrl?: string | null; clearAvatar?: boolean }) =>
    api.patch<AuthState>('/me', payload).then(r => r.data),

  getUsers: () =>
    api.get<User[]>('/users').then(r => r.data),
}
