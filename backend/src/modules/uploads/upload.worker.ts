import { NotificationType, UploadStatus } from '@prisma/client'
import { prisma } from '../../database/prisma.js'
import { logger } from '../../config/logger.js'
import { storageService } from '../../services/storage/storage.service.js'
import { youtubeService } from '../../services/youtube/youtube.service.js'
import { decryptToken, encryptToken } from '../../utils/tokenEncryption.js'

export const uploadWorker = {
  async process(jobId: string) {
    const claimed = await prisma.uploadJob.updateMany({ where: { id: jobId, status: { in: [UploadStatus.PENDING, UploadStatus.FAILED] } }, data: { status: UploadStatus.PROCESSING, attempts: { increment: 1 }, errorMessage: null } })
    if (!claimed.count) return false
    const job = await prisma.uploadJob.findUnique({ where: { id: jobId }, include: { video: { include: { metadata: true } }, channel: true } })
    if (!job) throw new Error('Upload job disappeared after it was claimed')
    const videoLabel = job.video.metadata?.title || job.video.videoName
    try {
      if (!job.video.videoPath || !job.video.metadata) throw new Error('Upload job is missing the video file or metadata')
      const refreshed = await youtubeService.refreshAccessToken(decryptToken(job.channel.refreshToken))
      const youtubeVideoId = await youtubeService.uploadVideo({ accessToken: refreshed.accessToken, filePath: storageService.resolve(job.video.videoPath), title: job.video.metadata.title, description: job.video.metadata.description, tags: job.video.metadata.hashtags, privacyStatus: 'public' })
      await prisma.$transaction([
        prisma.youtubeChannel.update({ where: { id: job.channelId }, data: { accessToken: encryptToken(refreshed.accessToken) } }),
        prisma.generatedVideo.update({ where: { id: job.videoId }, data: { youtubeVideoId } }),
        prisma.uploadJob.update({ where: { id: job.id }, data: { status: UploadStatus.SUCCESS, uploadedAt: new Date(), errorMessage: null } }),
        prisma.notification.create({ data: { userId: job.channel.userId, type: NotificationType.UPLOAD_SUCCESS, message: `Video published: ${job.video.metadata.title}` } }),
      ])
      logger.info('YouTube upload completed', { jobId, videoId: job.videoId, youtubeVideoId })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown YouTube upload error'
      await prisma.$transaction([
        prisma.uploadJob.update({ where: { id: job.id }, data: { status: UploadStatus.FAILED, errorMessage: message } }),
        prisma.notification.create({ data: { userId: job.channel.userId, type: NotificationType.UPLOAD_FAILED, message: `Upload failed: ${videoLabel}` } }),
      ])
      logger.error('YouTube upload failed', { jobId, error: message })
      return false
    }
  },
}