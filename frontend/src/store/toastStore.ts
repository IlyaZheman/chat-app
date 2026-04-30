import { create } from 'zustand'

interface Toast {
  id: number
  message: string
}

interface ToastStore {
  toasts: Toast[]
  show: (message: string) => void
  dismiss: (id: number) => void
}

let nextId = 0
const TOAST_DURATION_MS = 4000

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (message) => {
    const id = ++nextId
    set(s => ({ toasts: [...s.toasts, { id, message }] }))
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, TOAST_DURATION_MS)
  },
  dismiss: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))
