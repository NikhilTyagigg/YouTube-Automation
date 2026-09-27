import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../constants/routes'
import { uploadService } from '../services/uploadService'

export function useUploads() {
  return useQuery({ queryKey: queryKeys.uploads, queryFn: uploadService.queue })
}

export function useUploadLogs(id: string | null) {
  return useQuery({ queryKey: [...queryKeys.uploads, id, 'logs'], queryFn: () => uploadService.logs(id!), enabled: Boolean(id) })
}

export function useRetryUpload() {
  const client = useQueryClient()
  return useMutation({ mutationFn: uploadService.retry, onSuccess: () => { void client.invalidateQueries({ queryKey: queryKeys.uploads }); void client.invalidateQueries({ queryKey: queryKeys.dashboard }) } })
}

export function useCancelUpload() {
  const client = useQueryClient()
  return useMutation({ mutationFn: uploadService.cancel, onSuccess: () => { void client.invalidateQueries({ queryKey: queryKeys.uploads }); void client.invalidateQueries({ queryKey: queryKeys.dashboard }) } })
}