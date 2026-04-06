import api from './client'
import type { AuthState } from '../types'

export const usersApi = {
  register: (userName: string, email: string, password: string) =>
    api.post('/register', { userName, email, password }),

  login: (email: string, password: string) =>
    api.post('/login', { email, password }),

  me: () => api.get<AuthState>('/me').then(r => r.data),
}
