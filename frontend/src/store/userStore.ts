import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeMode } from '../types'

interface UserState { theme: ThemeMode; setTheme: (theme: ThemeMode) => void; toggleTheme: () => void }

export const useUserStore = create<UserState>()(persist((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}), { name: 'framewise-preferences' }))