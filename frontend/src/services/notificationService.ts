import { api } from './api'

export interface ApiNotification {
  id: string
  message: string
  type: 'UPLOAD_SUCCESS' | 'UPLOAD_FAILED' | 'VIDEO_GENERATED' | 'SCHEDULE_TRIGGERED' | 'SYSTEM'
  read: boolean
  createdAt: string
}

export const notificationService = {
  list: async () => (await api.get<ApiNotification[]>('/notifications')).data,
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  remove: (id: string) => api.delete(`/notifications/${id}`),
}