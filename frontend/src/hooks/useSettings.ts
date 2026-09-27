import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../constants/routes'
import { settingsService } from '../services/settingsService'

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings, queryFn: settingsService.get })
}

export function useSaveSettings() {
  const client = useQueryClient()
  return useMutation({ mutationFn: settingsService.save, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.settings }) })
}