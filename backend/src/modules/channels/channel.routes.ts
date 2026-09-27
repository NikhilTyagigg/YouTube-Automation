import { Router } from 'express'
import { z } from 'zod'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { ChannelStatus } from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../../database/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { validate } from '../../middleware/validate.js'
import { youtubeService } from '../../services/youtube/youtube.service.js'
import { decryptToken, encryptToken } from '../../utils/tokenEncryption.js'
import { routeParam } from '../../utils/routeParam.js'
import { AppError, NotFoundError } from '../../utils/AppError.js'

const channelIdSchema = z.object({ params: z.object({ id: z.string().min(1) }) })
const safeChannel = ({ accessToken: _access, refreshToken: _refresh, ...channel }: Record<string, unknown>) => channel
const stateCookie = 'youtube_oauth_state'
const callbackPath = '/api/channels/oauth/callback'
const stateCookieOptions = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax' as const, path: callbackPath, maxAge: 10 * 60 * 1000 }

async function saveAuthorizedChannel(userId: string, code: string) {
  const oauth = await youtubeService.exchangeAuthorizationCode(code)
  const { expiresIn: _expiresIn, ...channelData } = oauth
  const credentials = { accessToken: encryptToken(oauth.accessToken), refreshToken: encryptToken(oauth.refreshToken) }
  return prisma.youtubeChannel.upsert({
    where: { userId_channelId: { userId, channelId: oauth.channelId } },
    create: { ...channelData, ...credentials, userId },
    update: { ...channelData, ...credentials, status: ChannelStatus.CONNECTED },
  })
}

export const channelRoutes = Router()
channelRoutes.get('/oauth/callback', asyncHandler(async (request, response) => {
  const code = typeof request.query.code === 'string' ? request.query.code : ''
  const state = typeof request.query.state === 'string' ? request.query.state : ''
  const cookieState = request.cookies?.[stateCookie]
  response.clearCookie(stateCookie, { ...stateCookieOptions, maxAge: 0 })
  try {
    if (!code || !state || typeof cookieState !== 'string') throw new Error('Missing OAuth callback parameters')
    const suppliedState = Buffer.from(state)
    const cookieStateBuffer = Buffer.from(cookieState)
    if (suppliedState.length !== cookieStateBuffer.length || !timingSafeEqual(suppliedState, cookieStateBuffer)) throw new Error('OAuth state validation failed')
    const claims = jwt.verify(state, env.JWT_SECRET, { issuer: 'youtube-automation', audience: 'youtube-oauth' }) as jwt.JwtPayload
    if (typeof claims.sub !== 'string') throw new Error('OAuth state is invalid')
    await saveAuthorizedChannel(claims.sub, code)
    response.redirect(`${env.FRONTEND_URL}/channels?youtube=connected`)
  } catch {
    response.redirect(`${env.FRONTEND_URL}/channels?youtube_error=oauth_failed`)
  }
}))
channelRoutes.use(authenticate)
channelRoutes.get('/oauth/url', asyncHandler(async (request, response) => {
  if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET) throw new AppError('YouTube OAuth is not configured. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in backend/.env.', 503, 'YOUTUBE_OAUTH_NOT_CONFIGURED')
  const state = jwt.sign({ nonce: randomBytes(16).toString('hex') }, env.JWT_SECRET, { subject: request.user!.id, issuer: 'youtube-automation', audience: 'youtube-oauth', expiresIn: '10m' })
  response.cookie(stateCookie, state, stateCookieOptions)
  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authorizationUrl.search = new URLSearchParams({
    client_id: env.YOUTUBE_CLIENT_ID,
    redirect_uri: env.YOUTUBE_REDIRECT_URI,
    response_type: 'code',
    scope: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/yt-analytics.readonly', 'https://www.googleapis.com/auth/userinfo.email'].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  }).toString()
  response.json({ success: true, data: { authorizationUrl: authorizationUrl.toString() } })
}))
channelRoutes.get('/', asyncHandler(async (request, response) => {
  const channels = await prisma.youtubeChannel.findMany({ where: { userId: request.user!.id }, orderBy: { connectedAt: 'desc' } })
  response.json({ success: true, data: channels.map((channel) => safeChannel(channel as unknown as Record<string, unknown>)) })
}))
channelRoutes.get('/:id', validate(channelIdSchema), asyncHandler(async (request, response) => {
  const channel = await prisma.youtubeChannel.findFirst({ where: { id: routeParam(request, 'id'), userId: request.user!.id } })
  if (!channel) throw new NotFoundError('Channel')
  response.json({ success: true, data: safeChannel(channel as unknown as Record<string, unknown>) })
}))
channelRoutes.post('/:id/refresh', validate(channelIdSchema), asyncHandler(async (request, response) => {
  const id = routeParam(request, 'id')
  const channel = await prisma.youtubeChannel.findFirst({ where: { id, userId: request.user!.id } })
  if (!channel) throw new NotFoundError('Channel')
  const refreshed = await youtubeService.refreshAccessToken(decryptToken(channel.refreshToken))
  const updated = await prisma.youtubeChannel.update({ where: { id }, data: { accessToken: encryptToken(refreshed.accessToken), status: ChannelStatus.CONNECTED } })
  response.json({ success: true, data: safeChannel(updated as unknown as Record<string, unknown>) })
}))
channelRoutes.post('/disconnect', asyncHandler(async (request, response) => {
  const schema = z.object({ channelId: z.string().min(1) })
  const { channelId } = schema.parse(request.body)
  const result = await prisma.youtubeChannel.updateMany({ where: { id: channelId, userId: request.user!.id }, data: { status: ChannelStatus.DISCONNECTED } })
  if (!result.count) throw new NotFoundError('Channel')
  response.json({ success: true, data: { disconnected: true } })
}))