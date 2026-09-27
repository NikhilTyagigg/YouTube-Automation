import { createWriteStream } from 'node:fs'
import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import axios from 'axios'
import { env } from '../../config/env.js'
import { ExternalApiError } from '../../utils/AppError.js'

const storageRoot = path.resolve(env.UPLOAD_DIR)

export const storageService = {
  async download(url: string, filename: string) {
    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '-')
    const destination = path.join(storageRoot, safeName)
    await mkdir(storageRoot, { recursive: true })
    try {
      const response = await axios.get(url, { responseType: 'stream', timeout: 120_000, maxRedirects: 3 })
      await pipeline(response.data, createWriteStream(destination, { flags: 'wx' }))
      const file = await stat(destination)
      if (file.size === 0) throw new Error('Downloaded file is empty')
      return { path: destination, size: file.size }
    } catch (error) { throw new ExternalApiError('Unable to download generated media', error) }
  },
  resolve(filename: string) {
    const resolved = path.resolve(storageRoot, filename)
    if (!resolved.startsWith(`${storageRoot}${path.sep}`)) throw new ExternalApiError('Invalid storage path')
    return resolved
  },
}