import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../constants/routes'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'

export function useProfile() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.token))
  return useQuery({ queryKey: queryKeys.profile, queryFn: async () => (await authService.profile()).data, enabled: isAuthenticated })
}