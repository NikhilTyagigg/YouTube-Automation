import { api } from './api'

export interface AnalyticsPoint { date?: string; week?: string; month?: string; views: number; watchTime?: number; likes?: number; comments?: number; ctr?: number; engagementRate?: number }
export interface AnalyticsSummary { videosGenerated: number; videosUploaded: number; scheduledUploads: number; failedUploads: number; successRate: number; channels: number; views: number; watchTime: number; subscribers: number | null; ctr: number; engagement: number }

export const analyticsService = {
  summary: async () => (await api.get<AnalyticsSummary>('/analytics/summary')).data,
  daily: async () => (await api.get<AnalyticsPoint[]>('/analytics/daily')).data,
  weekly: async () => (await api.get<AnalyticsPoint[]>('/analytics/weekly')).data,
  monthly: async () => (await api.get<AnalyticsPoint[]>('/analytics/monthly')).data,
  video: async (id: string) => (await api.get<AnalyticsPoint[]>(`/analytics/video/${id}`)).data,
}