import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { env } from '../config/env.js'
import { ValidationError } from '../utils/AppError.js'

const uploadDirectory = path.resolve(env.UPLOAD_DIR, 'incoming')
fs.mkdirSync(uploadDirectory, { recursive: true })

export const mediaUpload = multer({
  storage: multer.diskStorage({ destination: uploadDirectory, filename: (_request, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`) }),
  limits: { fileSize: 1024 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(file.mimetype)) return callback(new ValidationError('Only MP4, MOV, and WebM videos are accepted'))
    callback(null, true)
  },
})