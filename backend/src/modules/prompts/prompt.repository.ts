import { Prisma } from '@prisma/client'
import { prisma } from '../../database/prisma.js'

export const promptRepository = {
  listByUser: (userId: string) => prisma.promptTemplate.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
  findById: (userId: string, id: string) => prisma.promptTemplate.findFirst({ where: { id, userId } }),
  create: (userId: string, data: Omit<Prisma.PromptTemplateUncheckedCreateInput, 'userId'>) => prisma.promptTemplate.create({ data: { ...data, userId } }),
  update: (userId: string, id: string, data: Parameters<typeof prisma.promptTemplate.update>[0]['data']) => prisma.promptTemplate.update({ where: { id, userId }, data }),
  delete: (userId: string, id: string) => prisma.promptTemplate.delete({ where: { id, userId } }),
}