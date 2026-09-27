import { api } from './api'
import type { ChannelItem } from '../types'

interface ApiChannel {
  id: string
  channelName: string
  email: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'ACTION_REQUIRED'
  connectedAt: string
}

function toChannelItem(channel: ApiChannel): ChannelItem {
  const nameParts = channel.channelName.trim().split(/\s+/)
  return {
    id: channel.id,
    name: channel.channelName,
    email: channel.email,
    status: channel.status === 'CONNECTED' ? 'Connected' : 'Action needed',
    connected: new Date(channel.connectedAt).toLocaleDateString(),
    subscribers: '—',
    avatar: nameParts.slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
  }
}

export const channelService = {
  async list(): Promise<ChannelItem[]> {
    const channels = await api.get<ApiChannel[]>('/channels')
    return channels.data.map(toChannelItem)
  },
  async authorizationUrl(): Promise<string> {
    const result = await api.get<{ authorizationUrl: string }>('/channels/oauth/url')
    return result.data.authorizationUrl
  },
  disconnect: (channelId: string) => api.post('/channels/disconnect', { channelId }),
  refresh: (channelId: string) => api.post(`/channels/${channelId}/refresh`),
}