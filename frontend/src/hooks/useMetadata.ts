import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { metadataService, type VideoMetadata } from '../services/metadataService'

const key = (id: string) => ['metadata', id] as const
export function useMetadata(videoId: string | null) { return useQuery({ queryKey: key(videoId || ''), queryFn: () => metadataService.get(videoId!), enabled: Boolean(videoId) }) }
export function useSaveMetadata(videoId: string | null) {
  const client = useQueryClient()
  return useMutation({ mutationFn: (data: Pick<VideoMetadata, 'title' | 'description' | 'hashtags'>) => metadataService.update(videoId!, data), onSuccess: (data) => client.setQueryData(key(videoId!), data) })
}
export function useRegenerateMetadata(videoId: string | null) {
  const client = useQueryClient()
  return useMutation({ mutationFn: () => metadataService.regenerate(videoId!), onSuccess: (data) => client.setQueryData(key(videoId!), data) })
}