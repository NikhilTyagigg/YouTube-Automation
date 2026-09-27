import { Router } from 'express'
import { UploadStatus } from '@prisma/client'
import { prisma } from '../../database/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { uploadWorker } from './upload.worker.js'
import { NotFoundError } from '../../utils/AppError.js'
import { routeParam } from '../../utils/routeParam.js'

export const uploadRoutes = Router()
uploadRoutes.use(authenticate)
uploadRoutes.get('/', asyncHandler(async (request, response) => {
  const uploads = await prisma.uploadJob.findMany({ where: { channel: { userId: request.user!.id } }, include: { video: { include: { metadata: true } }, channel: { select: { id: true, channelName: true } } }, orderBy: { scheduledTime: 'asc' }, take: 200 })
  response.json({ success: true, data: uploads })
}))
uploadRoutes.post('/retry/:id', asyncHandler(async (request, response) => {
  const updated = await prisma.uploadJob.updateMany({ where: { id: routeParam(request, 'id'), channel: { userId: request.user!.id }, status: UploadStatus.FAILED }, data: { status: UploadStatus.PENDING, errorMessage: null, scheduledTime: new Date() } })
  if (!updated.count) throw new NotFoundError('Failed upload job')
  response.status(202).json({ success: true, data: { queued: true } })
}))
uploadRoutes.delete('/cancel/:id', asyncHandler(async (request, response) => {
  const result = await prisma.uploadJob.deleteMany({ where: { id: routeParam(request, 'id'), channel: { userId: request.user!.id }, status: { in: [UploadStatus.PENDING, UploadStatus.PROCESSING] } } })
  if (!result.count) throw new NotFoundError('Active upload job')
  response.status(204).end()
}))
uploadRoutes.get('/:id/logs', asyncHandler(async (request, response) => {
  const job = await prisma.uploadJob.findFirst({ where: { id: routeParam(request, 'id'), channel: { userId: request.user!.id } }, include: { video: true } })
  if (!job) throw new NotFoundError('Upload job')
  response.json({ success: true, data: [{ at: job.createdAt, status: job.status, message: job.errorMessage || 'Upload status recorded' }] })
}))
uploadRoutes.post('/:id/process', asyncHandler(async (request, response) => {
  const job = await prisma.uploadJob.findFirst({ where: { id: routeParam(request, 'id'), channel: { userId: request.user!.id } } })
  if (!job) throw new NotFoundError('Upload job')
  await uploadWorker.process(job.id)
  response.json({ success: true, data: { processed: true } })
}))