import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { ValidationError } from '../utils/AppError.js'

export const validate = (schema: ZodType): RequestHandler => (request, _response, next) => {
  const result = schema.safeParse({ body: request.body, params: request.params, query: request.query })
  if (!result.success) return next(new ValidationError('Request validation failed', result.error.flatten()))
  if (result.data.body !== undefined) request.body = result.data.body
  next()
}