import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../database/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { validate } from '../../middleware/validate.js'

const settingsSchema = z.object({ body: z.object({ uploadTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(), timezone: z.string().min(1).max(100).optional(), defaultLanguage: z.string().min(2).max(50).optional(), defaultDuration: z.string().max(40).optional(), defaultStyle: z.string().max(100).optional(), geminiModel: z.string().max(150).optional(), youtubeChannelId: z.string().nullable().optional(), dailyUploadLimit: z.number().int().min(1).max(20).optional(), notifications: z.boolean().optional() }).strict() })

export const settingsRoutes = Router()
settingsRoutes.use(authenticate)
settingsRoutes.get('/', asyncHandler(async (request, response) => {
  const settings = await prisma.settings.upsert({ where: { userId: request.user!.id }, create: { userId: request.user!.id }, update: {} })
  response.json({ success: true, data: settings })
}))
settingsRoutes.put('/', validate(settingsSchema), asyncHandler(async (request, response) => {
  if (request.body.youtubeChannelId) {
    const channel = await prisma.youtubeChannel.findFirst({ where: { id: request.body.youtubeChannelId, userId: request.user!.id } })
    if (!channel) throw new (await import('../../utils/AppError.js')).NotFoundError('YouTube channel')
  }
  const settings = await prisma.settings.upsert({ where: { userId: request.user!.id }, create: { userId: request.user!.id, ...request.body }, update: request.body })
  response.json({ success: true, data: settings })
}))