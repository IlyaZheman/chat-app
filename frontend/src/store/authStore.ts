import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState } from '../types'

interface AuthStore {
  auth: AuthState | null
  setAuth: (auth: AuthState) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      auth: null,
      setAuth: (auth) => set({ auth }),
      clearAuth: () => set({ auth: null }),
    }),
    { name: 'chat-auth' }
  )
)
