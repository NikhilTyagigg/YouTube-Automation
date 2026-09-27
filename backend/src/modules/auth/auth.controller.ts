import type { Request, Response } from 'express'
import { env } from '../../config/env.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { authService } from './auth.service.js'

const cookieOptions = (expires: Date) => ({ httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax' as const, expires, path: '/api/auth' })
const refreshCookie = (response: Response, token: string, expires: Date) => response.cookie('refreshToken', token, cookieOptions(expires))
const clearRefreshCookie = (response: Response) => response.clearCookie('refreshToken', { ...cookieOptions(new Date(0)), expires: new Date(0) })

export const register = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.register(request.body)
  refreshCookie(response, result.refreshToken, result.refreshExpiresAt)
  response.status(201).json({ success: true, data: { user: result.user, accessToken: result.accessToken } })
})
export const login = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.login(request.body.email, request.body.password)
  refreshCookie(response, result.refreshToken, result.refreshExpiresAt)
  response.json({ success: true, data: { user: result.user, accessToken: result.accessToken } })
})
export const refresh = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.refresh(request.cookies?.refreshToken || request.body?.refreshToken)
  refreshCookie(response, result.refreshToken, result.refreshExpiresAt)
  response.json({ success: true, data: { user: result.user, accessToken: result.accessToken } })
})
export const logout = asyncHandler(async (request: Request, response: Response) => {
  await authService.logout(request.cookies?.refreshToken || request.body?.refreshToken)
  clearRefreshCookie(response)
  response.status(204).end()
})