import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { promptService } from '../services/promptService'
import { queryKeys } from '../constants/routes'
import type { PromptTemplate } from '../types'

export function usePrompts() {
  return useQuery({ queryKey: queryKeys.prompts, queryFn: promptService.list })
}

export function useSavePrompt() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (prompt: PromptTemplate) => prompt.id.startsWith('new-') ? promptService.create(prompt) : promptService.save(prompt), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.prompts }) })
}

export function useCreatePrompt() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: promptService.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.prompts }) })
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: promptService.save, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.prompts }) })
}

export function useDeletePrompt() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: promptService.remove, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.prompts }) })
}

export function usePromptHistory() {
  return useQuery({ queryKey: queryKeys.promptHistory, queryFn: promptService.history })
}

export function usePromptHistoryItem(id: string | null) {
  return useQuery({ queryKey: [...queryKeys.promptHistory, id], queryFn: () => promptService.historyItem(id!), enabled: Boolean(id) })
}