import path from 'node:path'
import { ChannelStatus, NotificationType, VideoStatus } from '@prisma/client'
import { prisma } from '../../database/prisma.js'
import { logger } from '../../config/logger.js'
import { geminiService } from '../../services/gemini/gemini.service.js'
import { storageService } from '../../services/storage/storage.service.js'
import { AppError, NotFoundError } from '../../utils/AppError.js'

function localDateParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)])) as { year: number; month: number; day: number }
}

function localDateTime(parts: { year: number; month: number; day: number }, time: string, timezone: string) {
  const { year, month, day } = parts
  const [hour, minute] = time.split(':').map(Number)
  const target = Date.UTC(year, month - 1, day, hour, minute)
  let result = new Date(target)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const formatted = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(result)
    const values = Object.fromEntries(formatted.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)])) as { year: number; month: number; day: number; hour: number; minute: number }
    const displayed = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute)
    const correction = target - displayed
    if (!correction) break
    result = new Date(result.getTime() + correction)
  }
  return result
}

function nextUploadTime(now: Date, time: string, timezone: string) {
  const today = localDateParts(now, timezone)
  let scheduledTime = localDateTime(today, time, timezone)
  if (scheduledTime <= now) {
    const nextDay = new Date(Date.UTC(today.year, today.month - 1, today.day + 1))
    scheduledTime = localDateTime({ year: nextDay.getUTCFullYear(), month: nextDay.getUTCMonth() + 1, day: nextDay.getUTCDate() }, time, timezone)
  }
  return scheduledTime
}

async function findPrompt(userId: string, promptId: string) {
  const prompt = await prisma.promptTemplate.findFirst({ where: { id: promptId, userId, isActive: true } })
  if (!prompt) throw new NotFoundError('Active prompt template')
  return prompt
}

async function processGeneration(userId: string, promptId: string, videoId: string, trendContext = '') {
  const prompt = await findPrompt(userId, promptId)
  const video = await prisma.generatedVideo.findUniqueOrThrow({ where: { id: videoId } })
  await prisma.generatedVideo.update({ where: { id: videoId }, data: { status: VideoStatus.GENERATING, generationError: null } })
  try {
  const enhancedPrompt = await geminiService.enhancePrompt(prompt.basePrompt, { style: prompt.style, audience: prompt.targetAudience, duration: prompt.duration, trends: trendContext })
  const finalPrompt = `${enhancedPrompt}\n\nLanguage: ${prompt.language}. Target duration: ${prompt.duration}. Visual style: ${prompt.style}. Audience: ${prompt.targetAudience}.${trendContext ? `\n\nCurrent trend research (use only relevant ideas; do not copy):\n${trendContext}` : ''}`
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
    const settings = await prisma.settings.findUnique({ where: { userId } })
    const channel = settings?.youtubeChannelId
      ? await prisma.youtubeChannel.findFirst({ where: { id: settings.youtubeChannelId, userId, status: ChannelStatus.CONNECTED } })
      : await prisma.youtubeChannel.findFirst({ where: { userId, status: ChannelStatus.CONNECTED }, orderBy: { connectedAt: 'asc' } })
    if (channel) {
      const scheduledTime = nextUploadTime(new Date(), settings?.uploadTime || '09:00', settings?.timezone || 'UTC')
      await prisma.uploadJob.create({ data: { videoId: video.id, channelId: channel.id, scheduledTime } })
    } else if (settings?.notifications !== false) {
      await prisma.notification.create({ data: { userId, type: NotificationType.SYSTEM, message: 'Video generated, but no connected YouTube channel is selected for automatic publishing.' } })
    }
    await prisma.notification.create({ data: { userId, type: NotificationType.VIDEO_GENERATED, message: `Video generated: ${title}` } })
    return { ...video, videoName: title, videoPath: stored.path, status: VideoStatus.COMPLETED }
  } catch (error) {
    const generationError = (error instanceof Error ? error.message : String(error)).slice(0, 2000)
    await prisma.generatedVideo.update({ where: { id: video.id }, data: { status: VideoStatus.FAILED, generationError } })
    await prisma.notification.create({ data: { userId, type: NotificationType.SYSTEM, message: `Video generation failed for “${prompt.name}”.` } })
    logger.error('Video generation pipeline failed', { videoId: video.id, promptId, error: error instanceof Error ? error.message : error })
    throw error
  }
}

export async function generateForPrompt(userId: string, promptId: string, trendContext = '') {
  const prompt = await findPrompt(userId, promptId)
  const video = await prisma.generatedVideo.create({ data: { promptId: prompt.id, videoName: `${prompt.name} · ${new Date().toISOString().slice(0, 10)}`, status: VideoStatus.PENDING, duration: prompt.duration } })
  return processGeneration(userId, prompt.id, video.id, trendContext)
}

export async function queueGeneration(userId: string, promptId: string) {
  const prompt = await findPrompt(userId, promptId)
  const activeVideo = await prisma.generatedVideo.findFirst({ where: { promptId: prompt.id, status: { in: [VideoStatus.PENDING, VideoStatus.GENERATING] } }, orderBy: { generatedAt: 'desc' } })
  if (activeVideo) return activeVideo
  const video = await prisma.generatedVideo.create({ data: { promptId: prompt.id, videoName: `${prompt.name} · ${new Date().toISOString().slice(0, 10)}`, status: VideoStatus.PENDING, duration: prompt.duration } })
  void processGeneration(userId, prompt.id, video.id).catch((error) => logger.error('Queued video generation failed', { videoId: video.id, error: error instanceof Error ? error.message : error }))
  return video
}

export async function retryGeneration(userId: string, videoId: string) {
  const video = await prisma.generatedVideo.findFirst({ where: { id: videoId, prompt: { userId } }, include: { prompt: true } })
  if (!video) throw new NotFoundError('Video')
  if (video.status !== VideoStatus.FAILED) throw new AppError('Only failed videos can be retried.', 409, 'VIDEO_NOT_FAILED')
  const claimed = await prisma.generatedVideo.updateMany({ where: { id: video.id, status: VideoStatus.FAILED }, data: { status: VideoStatus.PENDING, generationError: null } })
  if (!claimed.count) throw new AppError('This video is already being retried.', 409, 'VIDEO_RETRY_IN_PROGRESS')
  void processGeneration(userId, video.promptId, video.id).catch((error) => logger.error('Retried video generation failed', { videoId: video.id, error: error instanceof Error ? error.message : error }))
  return { ...video, status: VideoStatus.PENDING, generationError: null }
}