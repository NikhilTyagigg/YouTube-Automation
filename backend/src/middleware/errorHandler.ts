import type { ErrorRequestHandler, RequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { logger } from '../config/logger.js'
import { AppError } from '../utils/AppError.js'

export const notFoundHandler: RequestHandler = (request, _response, next) => next(new AppError(`Route ${request.method} ${request.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'))

export const errorHandler: ErrorRequestHandler = (error: unknown, request, response, _next) => {
  let normalized = error instanceof AppError ? error : new AppError('An unexpected error occurred', 500, 'INTERNAL_ERROR', false)
  if (error instanceof ZodError) normalized = new AppError('Request validation failed', 400, 'VALIDATION_ERROR')
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') normalized = new AppError('A record with this value already exists', 409, 'CONFLICT')
    else if (error.code === 'P2025') normalized = new AppError('The requested record was not found', 404, 'NOT_FOUND')
  }
  logger.error('request failed', { method: request.method, path: request.originalUrl, statusCode: normalized.statusCode, code: normalized.code, error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined })
  response.status(normalized.statusCode).json({ success: false, error: { code: normalized.code, message: normalized.message, ...(error instanceof ZodError ? { details: error.flatten() } : {}) } })
}