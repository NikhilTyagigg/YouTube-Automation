import { PrismaClient } from '@prisma/client'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

export const prisma = new PrismaClient({ log: env.NODE_ENV === 'development' ? [{ emit: 'event', level: 'query' }, { emit: 'stdout', level: 'warn' }, { emit: 'stdout', level: 'error' }] : [{ emit: 'stdout', level: 'error' }] })

if (env.NODE_ENV === 'development') {
  prisma.$on('query', (event) => logger.debug('database query', { durationMs: event.duration, query: event.query }))
}