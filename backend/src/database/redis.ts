import { createClient } from 'redis'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

export const redis = createClient({ url: env.REDIS_URL })
redis.on('error', (error) => logger.error('Redis client error', { error }))

export async function connectRedis() {
  if (!redis.isOpen) await redis.connect()
}