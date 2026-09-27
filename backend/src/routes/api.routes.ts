import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { analyticsRoutes } from '../modules/analytics/analytics.routes.js'
import { authRoutes } from '../modules/auth/auth.routes.js'
import { channelRoutes } from '../modules/channels/channel.routes.js'
import { metadataRoutes } from '../modules/metadata/metadata.routes.js'
import { notificationRoutes } from '../modules/notifications/notification.routes.js'
import { promptHistoryRoutes } from '../modules/prompt-evolution/prompt-history.routes.js'
import { promptRoutes } from '../modules/prompts/prompt.routes.js'
import { settingsRoutes } from '../modules/settings/settings.routes.js'
import { userRoutes } from '../modules/users/user.routes.js'
import { uploadRoutes } from '../modules/uploads/upload.routes.js'
import { videoRoutes } from '../modules/videos/video.routes.js'

export const apiRoutes = Router()
apiRoutes.use('/auth', rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }), authRoutes)
apiRoutes.use('/users', userRoutes)
apiRoutes.use('/prompts', promptRoutes)
apiRoutes.use('/prompt-history', promptHistoryRoutes)
apiRoutes.use('/videos', videoRoutes)
apiRoutes.use('/metadata', metadataRoutes)
apiRoutes.use('/channels', channelRoutes)
apiRoutes.use('/uploads', uploadRoutes)
apiRoutes.use('/analytics', analyticsRoutes)
apiRoutes.use('/notifications', notificationRoutes)
apiRoutes.use('/settings', settingsRoutes)