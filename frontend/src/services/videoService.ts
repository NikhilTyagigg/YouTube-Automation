import { api } from './api'
import type { VideoItem } from '../types'

export interface VideoRecord {
  id: string
  videoName: string
  prompt?: { name?: string }
  generatedAt: string
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED'
  youtubeVideoId?: string | null
  duration: string
  thumbnailPath?: string | null
  videoPath?: string | null
  metadata?: { title?: string } | null
}

function toVideoItem(video: VideoRecord): VideoItem {
  const status: VideoItem['status'] = video.youtubeVideoId ? 'Uploaded' : video.status === 'COMPLETED' ? 'Generated' : video.status === 'GENERATING' ? 'Processing' : video.status === 'FAILED' ? 'Failed' : 'Pending'
  return { id: video.id, title: video.metadata?.title || video.videoName, prompt: video.prompt?.name || 'Prompt template', date: new Date(video.generatedAt).toLocaleString(), status, duration: video.duration, views: '—', image: video.thumbnailPath || '' }
}

export const videoService = {
  list: async () => (await api.get<VideoRecord[]>('/videos')).data.map(toVideoItem),
  get: async (id: string) => (await api.get<VideoRecord>(`/videos/${id}`)).data,
  generate: (promptId: string) => api.post<VideoRecord>('/videos/generate', { promptId }),
  remove: (id: string) => api.delete(`/videos/${id}`),
  download: (id: string) => api.get<Blob>(`/videos/${id}/download`, { responseType: 'blob' }),
  downloadUrl: (id: string) => `${api.defaults.baseURL}/videos/${id}/download`,
}