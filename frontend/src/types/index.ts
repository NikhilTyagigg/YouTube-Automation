export type Role = 'admin' | 'editor' | 'viewer'
export type UploadStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
export type ThemeMode = 'light' | 'dark'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
}

export interface PromptTemplate {
  id: string
  name: string
  category: string
  basePrompt: string
  language: string
  duration: string
  style: string
  audience: string
  active: boolean
  updatedAt: string
}

export interface VideoItem {
  id: string
  promptId: string
  title: string
  prompt: string
  generationError?: string | null
  date: string
  status: 'Pending' | 'Processing' | 'Generated' | 'Uploaded' | 'Failed'
  duration: string
  views: string
  image: string
}

export interface ScheduleItem {
  id: string
  name: string
  cadence: 'Daily' | 'Weekly' | 'Custom'
  time: string
  days: string
  channel: string
  enabled: boolean
}

export interface NotificationItem {
  id: string
  title: string
  detail: string
  kind: 'success' | 'error' | 'info' | 'schedule'
  time: string
  read: boolean
}

export interface ChannelItem {
  id: string
  name: string
  email: string
  status: 'Connected' | 'Action needed'
  connected: string
  subscribers: string
  avatar: string
}