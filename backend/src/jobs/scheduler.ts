import cron from 'node-cron'
import { NotificationType, UploadStatus } from '@prisma/client'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { prisma } from '../database/prisma.js'
import { redis } from '../database/redis.js'
import { analyticsService } from '../services/analytics/analytics.service.js'
import { generateForPrompt } from '../modules/videos/video-generation.service.js'
import { uploadWorker } from '../modules/uploads/upload.worker.js'

const localLocks = new Map<string, number>()

async function acquireLock(key: string, seconds: number) {
  if (redis.isReady) return (await redis.set(key, '1', { NX: true, EX: seconds })) === 'OK'
  const now = Date.now()
  if ((localLocks.get(key) || 0) > now) return false
  localLocks.set(key, now + seconds * 1000)
  return true
}

function localClock(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date)
  return { hour: parts.find((part) => part.type === 'hour')?.value, minute: parts.find((part) => part.type === 'minute')?.value }
}

async function runDailyGenerations() {
  const now = new Date()
  const settings = await prisma.settings.findMany({ include: { user: true } })
  for (const setting of settings) {
    try {
      const time = localClock(now, setting.timezone)
      const [hour, minute] = setting.uploadTime.split(':')
      if (hour !== time.hour || minute !== time.minute) continue
      const day = new Intl.DateTimeFormat('en-CA', { timeZone: setting.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
      if (!(await acquireLock(`schedule:${setting.userId}:${day}`, 26 * 60 * 60))) continue
      const activePrompts = await prisma.promptTemplate.findMany({ where: { userId: setting.userId, isActive: true }, orderBy: { updatedAt: 'asc' }, take: setting.dailyUploadLimit })
      await prisma.notification.create({ data: { userId: setting.userId, type: NotificationType.SCHEDULE_TRIGGERED, message: `Daily automation started for ${activePrompts.length} active prompt(s).` } })
      logger.info('Daily generation run started', { userId: setting.userId, date: day, prompts: activePrompts.length, cron: env.DAILY_SCHEDULER_CRON })
      for (const prompt of activePrompts) {
        try { await generateForPrompt(setting.userId, prompt.id) }
        catch (error) { logger.error('Scheduled prompt generation failed', { userId: setting.userId, promptId: prompt.id, error: error instanceof Error ? error.message : error }) }
      }
    } catch (error) { logger.error('Unable to run a user schedule', { userId: setting.userId, error }) }
  }
}

async function processDueUploads() {
  const due = await prisma.uploadJob.findMany({ where: { status: UploadStatus.PENDING, scheduledTime: { lte: new Date() } }, select: { id: true }, take: 10, orderBy: { scheduledTime: 'asc' } })
  for (const job of due) {
    try { await uploadWorker.process(job.id) }
    catch (error) { logger.error('Upload worker failed unexpectedly', { jobId: job.id, error }) }
  }
}

export function startScheduler() {
  cron.schedule('* * * * *', () => {
    void runDailyGenerations().catch((error) => logger.error('Daily scheduler failed', { error }))
    void processDueUploads().catch((error) => logger.error('Upload scheduler failed', { error }))
  })
  cron.schedule('17 3 * * *', async () => {
    logger.info('Daily analytics collection started')
    const channels = await prisma.youtubeChannel.findMany({ where: { status: 'CONNECTED' }, select: { id: true } })
    for (const channel of channels) {
      try { await analyticsService.collectChannel(channel.id) }
      catch (error) { logger.error('Channel analytics collection failed', { channelId: channel.id, error }) }
    }
  })
  logger.info('Scheduled jobs registered')
}