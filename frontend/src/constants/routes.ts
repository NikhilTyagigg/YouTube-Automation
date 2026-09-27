export const appRoutes = {
  dashboard: '/',
  prompts: '/prompts',
  evolution: '/evolution',
  videos: '/videos',
  scheduler: '/scheduler',
  uploads: '/uploads',
  metadata: '/metadata',
  channels: '/channels',
  analytics: '/analytics',
  settings: '/settings',
} as const

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  profile: ['profile'] as const,
  prompts: ['prompts'] as const,
  promptHistory: ['prompt-history'] as const,
  videos: ['videos'] as const,
  uploads: ['uploads'] as const,
  notifications: ['notifications'] as const,
  channels: ['channels'] as const,
  settings: ['settings'] as const,
  analyticsSummary: ['analytics', 'summary'] as const,
  analyticsDaily: ['analytics', 'daily'] as const,
  analyticsWeekly: ['analytics', 'weekly'] as const,
  analyticsMonthly: ['analytics', 'monthly'] as const,
  analyticsVideo: (id: string) => ['analytics', 'video', id] as const,
}