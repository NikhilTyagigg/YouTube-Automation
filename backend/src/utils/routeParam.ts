import type { Request } from 'express'
import { ValidationError } from './AppError.js'

export function routeParam(request: Request, name: string) {
  const value = request.params[name]
  if (typeof value === 'string' && value.length > 0) return value
  if (Array.isArray(value) && value.length === 1 && value[0]) return value[0]
  throw new ValidationError(`Route parameter “${name}” is required`)
}