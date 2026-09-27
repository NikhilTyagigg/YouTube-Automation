import { create } from 'zustand'

export interface ToastItem { id: number; message: string; tone: 'error' | 'success' }
interface ToastState { items: ToastItem[]; add: (message: string, tone?: ToastItem['tone']) => void; dismiss: (id: number) => void }

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  add: (message, tone = 'error') => {
    const id = Date.now() + Math.random()
    set((state) => ({ items: [...state.items, { id, message, tone }] }))
    window.setTimeout(() => set((state) => ({ items: state.items.filter((item) => item.id !== id) })), 6000)
  },
  dismiss: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}))
