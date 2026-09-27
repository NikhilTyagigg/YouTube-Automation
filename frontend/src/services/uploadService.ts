import { api } from './api'
import type { UploadStatus } from '../types'

export interface ApiUpload {
  id: string
  videoId: string
  status: UploadStatus
  scheduledTime: string
  uploadedAt: string | null
  errorMessage: string | null
  attempts: number
  video: { videoName: string; duration: string; youtubeVideoId: string | null; metadata: { title: string } | null }
  channel: { id: string; channelName: string }
}

export const uploadService = {
  queue: async () => (await api.get<ApiUpload[]>('/uploads')).data,
  retry: (id: string) => api.post(`/uploads/retry/${id}`),
  cancel: (id: string) => api.delete(`/uploads/cancel/${id}`),
  logs: async (id: string) => (await api.get<Array<{ at: string; status: UploadStatus; message: string }>>(`/uploads/${id}/logs`)).data,
}