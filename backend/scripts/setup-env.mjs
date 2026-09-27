import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const examplePath = path.join(backendRoot, '.env.example')
const envPath = path.join(backendRoot, '.env')

if (existsSync(envPath)) {
  console.log('backend/.env already exists; leaving it unchanged.')
  process.exit(0)
}

if (!existsSync(examplePath)) {
  console.error('backend/.env.example is missing.')
  process.exit(1)
}

const localEnv = readFileSync(examplePath, 'utf8')
  .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(32).toString('hex')}`)
  .replace(/^JWT_REFRESH_SECRET=.*$/m, `JWT_REFRESH_SECRET=${randomBytes(32).toString('hex')}`)
  .replace(/^TOKEN_ENCRYPTION_KEY=.*$/m, `TOKEN_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}`)

writeFileSync(envPath, localEnv, { flag: 'wx', mode: 0o600 })
console.log('Created backend/.env with fresh local secrets. The file is git-ignored.')
console.log('Confirm DATABASE_URL matches your local PostgreSQL credentials before starting the API.')