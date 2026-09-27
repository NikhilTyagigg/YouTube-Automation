import { subDays } from 'date-fns'
import { prisma } from '../../database/prisma.js'
import { decryptToken, encryptToken } from '../../utils/tokenEncryption.js'

export const analyticsService = {
  async collectChannel(channelId: string) {
    const channel = await prisma.youtubeChannel.findUnique({ where: { id: channelId } })
    if (!channel?.channelId || channel.status !== 'CONNECTED') return
    const endDate = new Date().toISOString().slice(0, 10)
    const startDate = subDays(new Date(), 30).toISOString().slice(0, 10)
    const youtube = await import('../youtube/youtube.service.js')
    const refreshed = await youtube.youtubeService.refreshAccessToken(decryptToken(channel.refreshToken))
    const report = await youtube.youtubeService.fetchAnalytics({ accessToken: refreshed.accessToken, channelId: channel.channelId, startDate, endDate }) as { rows?: unknown[][] }
    await prisma.youtubeChannel.update({ where: { id: channel.id }, data: { accessToken: encryptToken(refreshed.accessToken) } })
    for (const row of report.rows || []) {
      const [date, youtubeVideoId, views, likes, comments, watchTime, ctr] = row
      if (typeof youtubeVideoId !== 'string' || typeof date !== 'string') continue
      const video = await prisma.generatedVideo.findUnique({ where: { youtubeVideoId } })
      if (!video) continue
      await prisma.videoAnalytics.upsert({
        where: { videoId_collectedAt: { videoId: video.id, collectedAt: new Date(`${date}T00:00:00.000Z`) } },
        create: { videoId: video.id, collectedAt: new Date(`${date}T00:00:00.000Z`), views: BigInt(Number(views) || 0), likes: BigInt(Number(likes) || 0), comments: BigInt(Number(comments) || 0), watchTime: Number(watchTime) || 0, ctr: Number(ctr) || 0, engagementRate: Number(views) ? ((Number(likes) + Number(comments)) / Number(views)) * 100 : 0 },
        update: { views: BigInt(Number(views) || 0), likes: BigInt(Number(likes) || 0), comments: BigInt(Number(comments) || 0), watchTime: Number(watchTime) || 0, ctr: Number(ctr) || 0 },
      })
    }
    return { rows: report.rows?.length || 0 }
  },
}