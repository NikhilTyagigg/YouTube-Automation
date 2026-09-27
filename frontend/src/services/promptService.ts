import { api } from './api'
import type { PromptTemplate } from '../types'

interface ApiPrompt {
  id: string
  name: string
  category: string
  basePrompt: string
  language: string
  duration: string
  style: string
  targetAudience: string
  active: boolean
  updatedAt: string
}

const fromApi = (item: ApiPrompt): PromptTemplate => ({ ...item, audience: item.targetAudience })
const toApi = (item: PromptTemplate) => ({ name: item.name, category: item.category, basePrompt: item.basePrompt, language: item.language, duration: item.duration, style: item.style, targetAudience: item.audience, isActive: item.active })

export const promptService = {
  list: async () => (await api.get<ApiPrompt[]>('/prompts')).data.map(fromApi),
  get: async (id: string) => fromApi((await api.get<ApiPrompt>(`/prompts/${id}`)).data),
  save: async (prompt: PromptTemplate) => fromApi((await api.put<ApiPrompt>(`/prompts/${prompt.id}`, toApi(prompt))).data),
  create: async (prompt: PromptTemplate) => fromApi((await api.post<ApiPrompt>('/prompts', toApi(prompt))).data),
  remove: (id: string) => api.delete(`/prompts/${id}`),
  history: async () => (await api.get<ApiPromptHistory[]>('/prompt-history')).data,
  historyItem: async (id: string) => (await api.get<ApiPromptHistory>(`/prompt-history/${id}`)).data,
}

export interface ApiPromptHistory {
  id: string
  originalPrompt: string
  enhancedPrompt: string
  finalPrompt: string
  generatedAt: string
  promptTemplate: { name: string }
}