import { api } from './api'

export const settingsService = {
  get: async () => (await api.get('/settings')).data,
  save: async (settings: Record<string, unknown>) => (await api.put('/settings', settings)).data,
}