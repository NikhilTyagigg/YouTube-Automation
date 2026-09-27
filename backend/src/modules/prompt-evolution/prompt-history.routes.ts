import { Router } from 'express'
import { prisma } from '../../database/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { NotFoundError } from '../../utils/AppError.js'
import { routeParam } from '../../utils/routeParam.js'

export const promptHistoryRoutes = Router()
promptHistoryRoutes.use(authenticate)
promptHistoryRoutes.get('/', asyncHandler(async (request, response) => {
  const records = await prisma.promptHistory.findMany({ where: { promptTemplate: { userId: request.user!.id } }, include: { promptTemplate: { select: { name: true } } }, orderBy: { generatedAt: 'desc' }, take: 100 })
  response.json({ success: true, data: records })
}))
promptHistoryRoutes.get('/:id', asyncHandler(async (request, response) => {
  const record = await prisma.promptHistory.findFirst({ where: { id: routeParam(request, 'id'), promptTemplate: { userId: request.user!.id } }, include: { promptTemplate: { select: { name: true } } } })
  if (!record) throw new NotFoundError('Prompt history')
  response.json({ success: true, data: record })
}))