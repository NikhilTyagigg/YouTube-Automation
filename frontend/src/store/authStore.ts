import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  bootstrapped: boolean
  setSession: (token: string, user: User) => void
  signOut: () => void
  setToken: (token: string | null) => void
  setBootstrapped: (value: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  bootstrapped: false,
  setSession: (token, user) => set({ token, user }),
  signOut: () => set({ token: null, user: null }),
  setToken: (token) => set({ token }),
  setBootstrapped: (bootstrapped) => set({ bootstrapped }),
}))