import { Router } from 'express'
import { prisma } from '../../database/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { NotFoundError } from '../../utils/AppError.js'
import { storageService } from '../../services/storage/storage.service.js'
import { queueGeneration, retryGeneration } from './video-generation.service.js'
import { z } from 'zod'
import { validate } from '../../middleware/validate.js'
import { routeParam } from '../../utils/routeParam.js'
import { createReadStream } from 'node:fs'
import path from 'node:path'

export const videoRoutes = Router()
videoRoutes.use(authenticate)
videoRoutes.post('/generate', validate(z.object({ body: z.object({ promptId: z.string().min(1) }) })), asyncHandler(async (request, response) => {
  const video = await queueGeneration(request.user!.id, request.body.promptId)
  response.status(202).json({ success: true, data: video })
}))
videoRoutes.post('/:id/retry', asyncHandler(async (request, response) => {
  const video = await retryGeneration(request.user!.id, routeParam(request, 'id'))
  response.status(202).json({ success: true, data: video })
}))
videoRoutes.get('/', asyncHandler(async (request, response) => {
  const videos = await prisma.generatedVideo.findMany({ where: { prompt: { userId: request.user!.id } }, include: { prompt: { select: { id: true, name: true } }, metadata: true }, orderBy: { generatedAt: 'desc' }, take: 100 })
  response.json({ success: true, data: videos })
}))
videoRoutes.get('/:id', asyncHandler(async (request, response) => {
  const video = await prisma.generatedVideo.findFirst({ where: { id: routeParam(request, 'id'), prompt: { userId: request.user!.id } }, include: { prompt: true, metadata: true, uploadJobs: true } })
  if (!video) throw new NotFoundError('Video')
  response.json({ success: true, data: video })
}))
videoRoutes.delete('/:id', asyncHandler(async (request, response) => {
  const video = await prisma.generatedVideo.findFirst({ where: { id: routeParam(request, 'id'), prompt: { userId: request.user!.id } } })
  if (!video) throw new NotFoundError('Video')
  if (video.videoPath) { try { const { unlink } = await import('node:fs/promises'); await unlink(storageService.resolve(video.videoPath)) } catch { /* stored artifact may already be removed */ } }
  await prisma.generatedVideo.delete({ where: { id: video.id } })
  response.status(204).end()
}))
videoRoutes.get('/:id/download', asyncHandler(async (request, response) => {
  const video = await prisma.generatedVideo.findFirst({ where: { id: routeParam(request, 'id'), prompt: { userId: request.user!.id } } })
  if (!video?.videoPath) throw new NotFoundError('Video file')
  const filePath = storageService.resolve(video.videoPath)
  response.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath).replace(/["\\\r\n]/g, '')}"`)
  response.type(path.extname(filePath))
  createReadStream(filePath).pipe(response)
}))