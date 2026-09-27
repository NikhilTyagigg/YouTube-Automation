import { api } from './api'

export interface VideoMetadata { id: string; videoId: string; title: string; description: string; hashtags: string[]; updatedAt: string }

export const metadataService = {
  get: async (videoId: string) => (await api.get<VideoMetadata | null>(`/metadata/${videoId}`)).data,
  update: async (videoId: string, data: Pick<VideoMetadata, 'title' | 'description' | 'hashtags'>) => (await api.put<VideoMetadata>(`/metadata/${videoId}`, data)).data,
  regenerate: async (videoId: string) => (await api.post<VideoMetadata>(`/metadata/regenerate/${videoId}`)).data,
}