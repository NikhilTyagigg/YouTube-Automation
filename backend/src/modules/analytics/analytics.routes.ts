import { Router } from 'express'
import { prisma } from '../../database/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { NotFoundError } from '../../utils/AppError.js'
import { routeParam } from '../../utils/routeParam.js'

export const analyticsRoutes = Router()
analyticsRoutes.use(authenticate)
analyticsRoutes.get('/summary', asyncHandler(async (request, response) => {
  const userId = request.user!.id
  const [generated, uploaded, scheduled, failed, channels, aggregate] = await Promise.all([
    prisma.generatedVideo.count({ where: { prompt: { userId } } }),
    prisma.uploadJob.count({ where: { channel: { userId }, status: 'SUCCESS' } }),
    prisma.uploadJob.count({ where: { channel: { userId }, status: { in: ['PENDING', 'PROCESSING'] } } }),
    prisma.uploadJob.count({ where: { channel: { userId }, status: 'FAILED' } }),
    prisma.youtubeChannel.count({ where: { userId, status: 'CONNECTED' } }),
    prisma.videoAnalytics.aggregate({ where: { video: { prompt: { userId } } }, _sum: { views: true, watchTime: true }, _avg: { ctr: true, engagementRate: true } }),
  ])
  response.json({ success: true, data: { videosGenerated: generated, videosUploaded: uploaded, scheduledUploads: scheduled, failedUploads: failed, successRate: uploaded + failed ? Math.round(uploaded / (uploaded + failed) * 100) : 0, channels, views: Number(aggregate._sum.views || 0n), watchTime: (aggregate._sum.watchTime || 0) / 60, subscribers: null, ctr: aggregate._avg.ctr || 0, engagement: aggregate._avg.engagementRate || 0 } })
}))
analyticsRoutes.get('/daily', asyncHandler(async (request, response) => {
  const since = new Date(Date.now() - 30 * 86400000)
  const rows = await prisma.videoAnalytics.findMany({ where: { video: { prompt: { userId: request.user!.id } }, collectedAt: { gte: since } }, orderBy: { collectedAt: 'asc' } })
  const grouped = new Map<string, { date: string; views: bigint; likes: bigint; comments: bigint; watchTime: number; ctr: number; engagementRate: number }>()
  for (const row of rows) { const date = row.collectedAt.toISOString().slice(0, 10); const group = grouped.get(date) || { date, views: 0n, likes: 0n, comments: 0n, watchTime: 0, ctr: 0, engagementRate: 0 }; group.views += row.views; group.likes += row.likes; group.comments += row.comments; group.watchTime += row.watchTime; group.ctr = Math.max(group.ctr, row.ctr); group.engagementRate = Math.max(group.engagementRate, row.engagementRate); grouped.set(date, group) }
  response.json({ success: true, data: [...grouped.values()].map((item) => ({ ...item, views: Number(item.views), likes: Number(item.likes), comments: Number(item.comments) })) })
}))
analyticsRoutes.get('/weekly', asyncHandler(async (request, response) => {
  const since = new Date(Date.now() - 84 * 86400000)
  const rows = await prisma.videoAnalytics.findMany({ where: { video: { prompt: { userId: request.user!.id } }, collectedAt: { gte: since } }, orderBy: { collectedAt: 'asc' } })
  const weeks = new Map<string, { week: string; views: bigint; watchTime: number }>()
  for (const row of rows) { const date = new Date(row.collectedAt); const weekStart = new Date(date); weekStart.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7)); const key = weekStart.toISOString().slice(0, 10); const group = weeks.get(key) || { week: key, views: 0n, watchTime: 0 }; group.views += row.views; group.watchTime += row.watchTime; weeks.set(key, group) }
  response.json({ success: true, data: [...weeks.values()].map((item) => ({ ...item, views: Number(item.views) })) })
}))
analyticsRoutes.get('/monthly', asyncHandler(async (request, response) => {
  const since = new Date(); since.setUTCMonth(since.getUTCMonth() - 12)
  const rows = await prisma.videoAnalytics.findMany({ where: { video: { prompt: { userId: request.user!.id } }, collectedAt: { gte: since } }, orderBy: { collectedAt: 'asc' } })
  const months = new Map<string, { month: string; views: bigint; watchTime: number }>()
  for (const row of rows) { const date = row.collectedAt; const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`; const group = months.get(key) || { month: key, views: 0n, watchTime: 0 }; group.views += row.views; group.watchTime += row.watchTime; months.set(key, group) }
  response.json({ success: true, data: [...months.values()].map((item) => ({ ...item, views: Number(item.views) })) })
}))
analyticsRoutes.get('/video/:id', asyncHandler(async (request, response) => {
  const video = await prisma.generatedVideo.findFirst({ where: { id: routeParam(request, 'id'), prompt: { userId: request.user!.id } }, select: { id: true } })
  if (!video) throw new NotFoundError('Video')
  const analytics = await prisma.videoAnalytics.findMany({ where: { videoId: video.id }, orderBy: { collectedAt: 'asc' } })
  response.json({ success: true, data: analytics.map((row) => ({ ...row, views: Number(row.views), likes: Number(row.likes), comments: Number(row.comments) })) })
}))