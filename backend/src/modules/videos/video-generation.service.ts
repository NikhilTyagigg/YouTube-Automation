import path from 'node:path'
import { NotificationType, VideoStatus } from '@prisma/client'
import { prisma } from '../../database/prisma.js'
import { logger } from '../../config/logger.js'
import { geminiService } from '../../services/gemini/gemini.service.js'
import { storageService } from '../../services/storage/storage.service.js'
import { NotFoundError } from '../../utils/AppError.js'

async function findPrompt(userId: string, promptId: string) {
  const prompt = await prisma.promptTemplate.findFirst({ where: { id: promptId, userId, isActive: true } })
  if (!prompt) throw new NotFoundError('Active prompt template')
  return prompt
}

async function processGeneration(userId: string, promptId: string, videoId: string) {
  const prompt = await findPrompt(userId, promptId)
  const video = await prisma.generatedVideo.findUniqueOrThrow({ where: { id: videoId } })
  await prisma.generatedVideo.update({ where: { id: videoId }, data: { status: VideoStatus.GENERATING } })
  try {
  const enhancedPrompt = await geminiService.enhancePrompt(prompt.basePrompt, { style: prompt.style, audience: prompt.targetAudience, duration: prompt.duration })
  const finalPrompt = `${enhancedPrompt}\n\nLanguage: ${prompt.language}. Target duration: ${prompt.duration}. Visual style: ${prompt.style}. Audience: ${prompt.targetAudience}.`
  await prisma.promptHistory.create({ data: { promptTemplateId: prompt.id, originalPrompt: prompt.basePrompt, enhancedPrompt, finalPrompt } })
    const operation = await geminiService.generateVideo(finalPrompt)
    const result = await geminiService.waitForVideo(operation.operationName) as { generateVideoResponse?: { generatedSamples?: Array<{ video?: { uri?: string } }> } }
    const videoUrl = result.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
    if (!videoUrl) throw new Error('Gemini completed without a downloadable video URI')
    const filename = `${video.id}-${path.basename(new URL(videoUrl).pathname) || 'generated.mp4'}`
    const stored = await storageService.download(videoUrl, filename)
    const metadataPrompt = `${prompt.basePrompt}\n\n${enhancedPrompt}`
    const [title, description, hashtags] = await Promise.all([geminiService.generateTitle(metadataPrompt), geminiService.generateDescription(metadataPrompt), geminiService.generateHashtags(metadataPrompt)])
    await prisma.$transaction([
      prisma.generatedVideo.update({ where: { id: video.id }, data: { videoName: title, videoPath: stored.path, status: VideoStatus.COMPLETED } }),
      prisma.videoMetadata.create({ data: { videoId: video.id, title, description, hashtags } }),
    ])
    const settings = await prisma.settings.findUnique({ where: { userId }, include: { youtubeChannel: true } })
    const channel = settings?.youtubeChannel || await prisma.youtubeChannel.findFirst({ where: { userId, status: 'CONNECTED' }, orderBy: { connectedAt: 'asc' } })
    if (channel && settings?.notifications !== false) {
      const scheduledTime = new Date()
      scheduledTime.setUTCMinutes(0, 0, 0)
      scheduledTime.setUTCHours(scheduledTime.getUTCHours() + 1)
      await prisma.uploadJob.create({ data: { videoId: video.id, channelId: channel.id, scheduledTime } })
    }
    await prisma.notification.create({ data: { userId, type: NotificationType.VIDEO_GENERATED, message: `Video generated: ${title}` } })
    return { ...video, videoName: title, videoPath: stored.path, status: VideoStatus.COMPLETED }
  } catch (error) {
    await prisma.generatedVideo.update({ where: { id: video.id }, data: { status: VideoStatus.FAILED } })
    await prisma.notification.create({ data: { userId, type: NotificationType.SYSTEM, message: `Video generation failed for “${prompt.name}”.` } })
    logger.error('Video generation pipeline failed', { videoId: video.id, promptId, error: error instanceof Error ? error.message : error })
    throw error
  }
}

export async function generateForPrompt(userId: string, promptId: string) {
  const prompt = await findPrompt(userId, promptId)
  const video = await prisma.generatedVideo.create({ data: { promptId: prompt.id, videoName: `${prompt.name} · ${new Date().toISOString().slice(0, 10)}`, status: VideoStatus.PENDING, duration: prompt.duration } })
  return processGeneration(userId, prompt.id, video.id)
}

export async function queueGeneration(userId: string, promptId: string) {
  const prompt = await findPrompt(userId, promptId)
  const video = await prisma.generatedVideo.create({ data: { promptId: prompt.id, videoName: `${prompt.name} · ${new Date().toISOString().slice(0, 10)}`, status: VideoStatus.PENDING, duration: prompt.duration } })
  void processGeneration(userId, prompt.id, video.id).catch((error) => logger.error('Queued video generation failed', { videoId: video.id, error: error instanceof Error ? error.message : error }))
  return video
}