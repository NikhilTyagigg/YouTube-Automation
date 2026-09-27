import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { AuthenticationError, AppError } from '../../utils/AppError.js'
import { authRepository } from './auth.repository.js'

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')
const publicUser = (user: { id: string; name: string; email: string; role: string }) => ({ id: user.id, name: user.name, email: user.email, role: user.role.toLowerCase() })

function accessToken(user: { id: string; email: string; role: string }) {
  return jwt.sign({ email: user.email, role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'] })
}

async function issueRefreshToken(userId: string) {
  const token = randomBytes(48).toString('base64url')
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 86400000)
  await authRepository.saveRefreshToken({ tokenHash: tokenHash(token), userId, expiresAt })
  return { token, expiresAt }
}

export const authService = {
  async register(input: { name: string; email: string; password: string }) {
    if (await authRepository.findUserByEmail(input.email.toLowerCase())) throw new AppError('An account with this email already exists', 409, 'EMAIL_IN_USE')
    const user = await authRepository.createUser({ ...input, email: input.email.toLowerCase(), password: await bcrypt.hash(input.password, 12) })
    const refresh = await issueRefreshToken(user.id)
    return { user: publicUser(user), accessToken: accessToken(user), refreshToken: refresh.token, refreshExpiresAt: refresh.expiresAt }
  },
  async login(email: string, password: string) {
    const user = await authRepository.findUserByEmail(email.toLowerCase())
    if (!user || !(await bcrypt.compare(password, user.password))) throw new AuthenticationError('Email or password is incorrect')
    const refresh = await issueRefreshToken(user.id)
    return { user: publicUser(user), accessToken: accessToken(user), refreshToken: refresh.token, refreshExpiresAt: refresh.expiresAt }
  },
  async refresh(token: string) {
    if (!token) throw new AuthenticationError('Refresh token is required')
    const session = await authRepository.findRefreshToken(tokenHash(token))
    if (!session || session.revokedAt || session.expiresAt <= new Date()) throw new AuthenticationError('Refresh token is invalid or expired')
    const consumed = await authRepository.consumeRefreshToken(session.id)
    if (!consumed.count) throw new AuthenticationError('Refresh token has already been used')
    const refresh = await issueRefreshToken(session.userId)
    return { user: publicUser(session.user), accessToken: accessToken(session.user), refreshToken: refresh.token, refreshExpiresAt: refresh.expiresAt }
  },
  async logout(token?: string) {
    if (!token) return
    const session = await authRepository.findRefreshToken(tokenHash(token))
    if (session && !session.revokedAt) await authRepository.revokeRefreshToken(session.id)
  },
}