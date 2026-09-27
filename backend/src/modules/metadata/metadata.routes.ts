import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../database/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { validate } from '../../middleware/validate.js'
import { geminiService } from '../../services/gemini/gemini.service.js'
import { NotFoundError } from '../../utils/AppError.js'
import { routeParam } from '../../utils/routeParam.js'

const updateSchema = z.object({ params: z.object({ videoId: z.string().min(1) }), body: z.object({ title: z.string().trim().min(1).max(100), description: z.string().max(5000), hashtags: z.array(z.string().max(100)).max(30) }) })
const idSchema = z.object({ params: z.object({ videoId: z.string().min(1) }) })
async function ownedVideo(userId: string, videoId: string) {
  const video = await prisma.generatedVideo.findFirst({ where: { id: videoId, prompt: { userId } }, include: { prompt: true, metadata: true } })
  if (!video) throw new NotFoundError('Video')
  return video
}

export const metadataRoutes = Router()
metadataRoutes.use(authenticate)
metadataRoutes.get('/:videoId', validate(idSchema), asyncHandler(async (request, response) => {
  const video = await ownedVideo(request.user!.id, routeParam(request, 'videoId'))
  response.json({ success: true, data: video.metadata })
}))
metadataRoutes.put('/:videoId', validate(updateSchema), asyncHandler(async (request, response) => {
  await ownedVideo(request.user!.id, routeParam(request, 'videoId'))
  const { title, description, hashtags } = request.body as { title: string; description: string; hashtags: string[] }
  const videoId = routeParam(request, 'videoId')
  const metadata = await prisma.videoMetadata.upsert({ where: { videoId }, create: { videoId, title, description, hashtags }, update: { title, description, hashtags } })
  response.json({ success: true, data: metadata })
}))
metadataRoutes.post('/regenerate/:videoId', validate(idSchema), asyncHandler(async (request, response) => {
  const video = await ownedVideo(request.user!.id, routeParam(request, 'videoId'))
  const [title, description, hashtags] = await Promise.all([geminiService.generateTitle(video.prompt.basePrompt), geminiService.generateDescription(video.prompt.basePrompt), geminiService.generateHashtags(video.prompt.basePrompt)])
  const metadata = await prisma.videoMetadata.upsert({ where: { videoId: video.id }, create: { videoId: video.id, title, description, hashtags }, update: { title, description, hashtags } })
  response.json({ success: true, data: metadata })
}))