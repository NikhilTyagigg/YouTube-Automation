import axios from 'axios'
import { env } from '../../config/env.js'
import { ExternalApiError } from '../../utils/AppError.js'

const youtube = axios.create({ baseURL: 'https://www.googleapis.com/youtube/v3', timeout: 30_000 })
const uploadBase = 'https://www.googleapis.com/upload/youtube/v3/videos'

export const youtubeService = {
  async exchangeAuthorizationCode(code: string) {
    const clientId = env.YOUTUBE_CLIENT_ID
    const clientSecret = env.YOUTUBE_CLIENT_SECRET
    if (!clientId || !clientSecret) throw new ExternalApiError('YouTube OAuth is not configured')
    try {
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: env.YOUTUBE_REDIRECT_URI, grant_type: 'authorization_code' }), { timeout: 20_000 })
      const token = tokenResponse.data as { access_token: string; refresh_token?: string; expires_in: number }
      if (!token.refresh_token) throw new Error('YouTube did not return a refresh token; revoke prior consent and reconnect')
      const channelResponse = await youtube.get('/channels', { params: { part: 'snippet', mine: true }, headers: { Authorization: `Bearer ${token.access_token}` } })
      const channel = channelResponse.data.items?.[0]
      if (!channel) throw new Error('No YouTube channel was returned for this account')
      const profile = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` }, timeout: 15_000 })
      return { channelName: channel.snippet.title as string, channelId: channel.id as string, email: profile.data.email as string, accessToken: token.access_token as string, refreshToken: token.refresh_token, expiresIn: token.expires_in as number }
    } catch (error) { throw new ExternalApiError('YouTube channel authorization failed', error) }
  },
  async refreshAccessToken(refreshToken: string) {
    if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET) throw new ExternalApiError('YouTube OAuth is not configured')
    try {
      const { data } = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({ refresh_token: refreshToken, client_id: env.YOUTUBE_CLIENT_ID, client_secret: env.YOUTUBE_CLIENT_SECRET, grant_type: 'refresh_token' }), { timeout: 20_000 })
      return { accessToken: data.access_token as string, expiresIn: data.expires_in as number }
    } catch (error) { throw new ExternalApiError('YouTube access token refresh failed', error) }
  },
  async uploadVideo(input: { accessToken: string; filePath: string; title: string; description: string; tags: string[]; categoryId?: string; privacyStatus?: string }) {
    const { createReadStream, statSync } = await import('node:fs')
    try {
      const init = await axios.post(uploadBase, { snippet: { title: input.title, description: input.description, tags: input.tags, categoryId: input.categoryId || '22' }, status: { privacyStatus: input.privacyStatus || 'private' } }, { params: { uploadType: 'resumable', part: 'snippet,status' }, headers: { Authorization: `Bearer ${input.accessToken}`, 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'video/*', 'X-Upload-Content-Length': String(statSync(input.filePath).size) } })
      const uploadUrl = init.headers.location
      if (!uploadUrl) throw new Error('YouTube did not provide a resumable upload URL')
      const uploaded = await axios.put(uploadUrl, createReadStream(input.filePath), { headers: { 'Content-Type': 'video/*', 'Content-Length': statSync(input.filePath).size }, maxBodyLength: Infinity, maxContentLength: Infinity, timeout: 15 * 60_000 })
      return uploaded.data.id as string
    } catch (error) { throw new ExternalApiError('YouTube video upload failed', error) }
  },
  async updateVideo(input: { accessToken: string; videoId: string; title: string; description: string; tags: string[] }) {
    try { return (await youtube.put('/videos', { id: input.videoId, snippet: { title: input.title, description: input.description, tags: input.tags } }, { params: { part: 'snippet' }, headers: { Authorization: `Bearer ${input.accessToken}` } })).data }
    catch (error) { throw new ExternalApiError('YouTube metadata update failed', error) }
  },
  async deleteVideo(accessToken: string, videoId: string) {
    try { await youtube.delete('/videos', { params: { id: videoId }, headers: { Authorization: `Bearer ${accessToken}` } }) }
    catch (error) { throw new ExternalApiError('YouTube video deletion failed', error) }
  },
  async fetchAnalytics(input: { accessToken: string; channelId: string; startDate: string; endDate: string }) {
    try {
      const { data } = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', { params: { ids: `channel==${input.channelId}`, startDate: input.startDate, endDate: input.endDate, metrics: 'views,likes,comments,estimatedMinutesWatched,impressionsClickThroughRate', dimensions: 'day,video' }, headers: { Authorization: `Bearer ${input.accessToken}` }, timeout: 30_000 })
      return data
    } catch (error) { throw new ExternalApiError('YouTube analytics request failed', error) }
  },
}