import api from './client'

export const usersApi = {
  register: (userName: string, email: string, password: string) =>
    api.post('/register', { userName, email, password }),

  login: (email: string, password: string) =>
    api.post('/login', { email, password }),
}
