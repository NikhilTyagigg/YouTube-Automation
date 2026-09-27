import { app } from './app.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { prisma } from './database/prisma.js'
import { connectRedis, redis } from './database/redis.js'
import { startScheduler } from './jobs/scheduler.js'

let server: ReturnType<typeof app.listen> | undefined

async function start() {
  await prisma.$connect()
  try { await connectRedis() } catch (error) { logger.warn('Redis unavailable; scheduler locks are process-local', { error }) }
  startScheduler()
  server = app.listen(env.PORT, () => logger.info('API listening', { port: env.PORT, environment: env.NODE_ENV }))
}

async function shutdown(signal: string) {
  logger.info('Shutdown started', { signal })
  server?.close()
  await Promise.allSettled([prisma.$disconnect(), redis.isOpen ? redis.quit() : Promise.resolve()])
  process.exit(0)
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))
start().catch((error) => { logger.error('API startup failed', { error }); process.exit(1) })