import { Router } from 'express'
import { prisma } from '../../database/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { NotFoundError } from '../../utils/AppError.js'
import { routeParam } from '../../utils/routeParam.js'

export const notificationRoutes = Router()
notificationRoutes.use(authenticate)
notificationRoutes.get('/', asyncHandler(async (request, response) => {
  const notifications = await prisma.notification.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: 'desc' }, take: 100 })
  response.json({ success: true, data: notifications })
}))
notificationRoutes.patch('/:id/read', asyncHandler(async (request, response) => {
  const result = await prisma.notification.updateMany({ where: { id: routeParam(request, 'id'), userId: request.user!.id }, data: { read: true } })
  if (!result.count) throw new NotFoundError('Notification')
  response.json({ success: true, data: { read: true } })
}))
notificationRoutes.delete('/:id', asyncHandler(async (request, response) => {
  const result = await prisma.notification.deleteMany({ where: { id: routeParam(request, 'id'), userId: request.user!.id } })
  if (!result.count) throw new NotFoundError('Notification')
  response.status(204).end()
}))