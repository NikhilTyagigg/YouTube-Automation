import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { openApiDocument } from './config/openapi.js'
import { apiRoutes } from './routes/api.routes.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import { prisma } from './database/prisma.js'
import { redis } from './database/redis.js'

export const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false }))
const developmentOrigins = new Set([env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5176', 'http://127.0.0.1:5176'])
app.use(cors({ origin: (origin, callback) => {
  if (!origin || env.NODE_ENV !== 'production' && developmentOrigins.has(origin) || origin === env.FRONTEND_URL) return callback(null, true)
  callback(new Error('Origin is not allowed by CORS'))
}, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }))
app.use(compression())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: false, limit: '2mb' }))
app.use(cookieParser())
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim(), { type: 'http' }) } }))

app.get('/api/health', async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    response.json({ success: true, data: { status: 'ok', database: 'connected', redis: redis.isReady ? 'connected' : 'unavailable', timestamp: new Date().toISOString() } })
  } catch { response.status(503).json({ success: false, data: { status: 'degraded', database: 'unavailable', redis: redis.isReady ? 'connected' : 'unavailable' } }) }
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: 'YouTube Automation API' }))
app.use('/api', apiRoutes)

app.use(notFoundHandler)
app.use(errorHandler)