import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { videoService } from '../services/videoService'
import { queryKeys } from '../constants/routes'

export function useVideos() {
  return useQuery({ queryKey: queryKeys.videos, queryFn: videoService.list })
}

export function useVideo(id: string | null) {
  return useQuery({ queryKey: [...queryKeys.videos, id], queryFn: () => videoService.get(id!), enabled: Boolean(id) })
}

export function useGenerateVideo() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: videoService.generate, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: queryKeys.videos }); void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }) } })
}

export function useDeleteVideo() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: videoService.remove, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: queryKeys.videos }); void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }) } })
}