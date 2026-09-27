import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const signOut = useAuthStore((state) => state.signOut)
  return { user, token, isAuthenticated: Boolean(token), signOut, role: user?.role }
}