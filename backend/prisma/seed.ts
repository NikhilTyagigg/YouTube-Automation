import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!email || !password || password.length < 10) throw new Error('Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 10 characters before seeding')
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.upsert({ where: { email }, create: { name: 'Studio Administrator', email, password: passwordHash, role: UserRole.ADMIN, settings: { create: { timezone: 'UTC', uploadTime: '09:00' } } }, update: { name: 'Studio Administrator' } })
  const prompts = [
    { name: 'Quietly Better Habits', category: 'Wellness', basePrompt: 'Create a thoughtful short film about one tiny habit that changes an ordinary morning.', language: 'English', style: 'Cinematic', targetAudience: 'Young professionals', duration: '45 sec' },
    { name: 'Field Notes: Future Cities', category: 'Technology', basePrompt: 'Explain one emerging urban technology through the lens of a person who uses it every day.', language: 'English', style: 'Documentary', targetAudience: 'Curious generalists', duration: '2 min' },
    { name: 'Small Kitchen, Big Flavor', category: 'Food', basePrompt: 'Show how a simple pantry ingredient can become an unforgettable weeknight meal.', language: 'Spanish', style: 'Warm & tactile', targetAudience: 'Home cooks', duration: '60 sec' },
  ]
  for (const prompt of prompts) await prisma.promptTemplate.upsert({ where: { id: `seed-${prompt.category.toLowerCase()}` }, create: { ...prompt, id: `seed-${prompt.category.toLowerCase()}`, userId: user.id }, update: prompt })
  console.info(`Seeded administrator ${email} and ${prompts.length} prompt templates.`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())