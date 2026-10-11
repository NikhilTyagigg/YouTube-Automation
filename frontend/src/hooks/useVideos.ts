import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { videoService } from '../services/videoService'
import { queryKeys } from '../constants/routes'

export function useVideos() {
  return useQuery({ queryKey: queryKeys.videos, queryFn: videoService.list, refetchInterval: (query) => query.state.data?.some((video) => video.status === 'Pending' || video.status === 'Processing') ? 4000 : false })
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

export function useRetryVideo() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: videoService.retry, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: queryKeys.videos }); void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }) } })
}