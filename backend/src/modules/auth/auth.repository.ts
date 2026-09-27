import { prisma } from '../../database/prisma.js'

export const authRepository = {
  findUserByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  createUser: (input: { name: string; email: string; password: string }) => prisma.user.create({ data: { ...input, settings: { create: {} } } }),
  saveRefreshToken: (input: { tokenHash: string; userId: string; expiresAt: Date }) => prisma.refreshToken.create({ data: input }),
  findRefreshToken: (tokenHash: string) => prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } }),
  consumeRefreshToken: (id: string) => prisma.refreshToken.updateMany({ where: { id, revokedAt: null, expiresAt: { gt: new Date() } }, data: { revokedAt: new Date() } }),
  revokeRefreshToken: (id: string) => prisma.refreshToken.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: new Date() } }),
}