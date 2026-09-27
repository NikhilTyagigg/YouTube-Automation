import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'
import { env } from '../config/env.js'
import { AuthenticationError, AuthorizationError } from '../utils/AppError.js'

interface AccessClaims extends jwt.JwtPayload { email: string; role: UserRole }

export const authenticate: RequestHandler = (request, _response, next) => {
  const bearer = request.headers.authorization
  if (!bearer?.startsWith('Bearer ')) return next(new AuthenticationError())
  try {
    const claims = jwt.verify(bearer.slice(7), env.JWT_SECRET) as AccessClaims
    if (!claims.sub || !claims.email || !Object.values(UserRole).includes(claims.role)) throw new AuthenticationError('Access token is invalid')
    request.user = { id: claims.sub, email: claims.email, role: claims.role }
    next()
  } catch (error) { next(error instanceof AuthenticationError ? error : new AuthenticationError('Access token is invalid or expired')) }
}

export const requireRoles = (...roles: UserRole[]): RequestHandler => (request, _response, next) => {
  if (!request.user) return next(new AuthenticationError())
  if (!roles.includes(request.user.role)) return next(new AuthorizationError())
  next()
}