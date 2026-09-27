import { Router } from 'express'
import { prisma } from '../../database/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { NotFoundError } from '../../utils/AppError.js'

export const userRoutes = Router()
userRoutes.use(authenticate)
userRoutes.get('/me', asyncHandler(async (request, response) => {
  const user = await prisma.user.findUnique({ where: { id: request.user!.id }, select: { id: true, name: true, email: true, role: true, createdAt: true } })
  if (!user) throw new NotFoundError('User')
  response.json({ success: true, data: { ...user, role: user.role.toLowerCase() } })
}))