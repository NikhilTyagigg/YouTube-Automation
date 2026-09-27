import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { env } from '../config/env.js'
import { AppError } from './AppError.js'

function key() {
  if (!env.TOKEN_ENCRYPTION_KEY) throw new AppError('TOKEN_ENCRYPTION_KEY is required to connect a YouTube channel', 503, 'TOKEN_ENCRYPTION_NOT_CONFIGURED')
  return Buffer.from(env.TOKEN_ENCRYPTION_KEY, 'hex')
}

export function encryptToken(token: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}.${cipher.getAuthTag().toString('hex')}.${encrypted.toString('hex')}`
}

export function decryptToken(value: string) {
  const [ivHex, tagHex, encryptedHex] = value.split('.')
  if (!ivHex || !tagHex || !encryptedHex) throw new AppError('Stored channel credential is invalid', 500, 'INVALID_STORED_CREDENTIAL')
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8')
}