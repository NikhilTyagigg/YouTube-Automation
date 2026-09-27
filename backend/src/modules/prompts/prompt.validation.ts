import { z } from 'zod'

const promptFields = {
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  basePrompt: z.string().trim().min(10).max(10000),
  language: z.string().trim().min(2).max(50).default('English'),
  style: z.string().trim().min(2).max(100).default('Cinematic'),
  targetAudience: z.string().trim().max(250).default(''),
  duration: z.string().trim().min(2).max(40).default('60 sec'),
  isActive: z.boolean().default(true),
}

export const createPromptSchema = z.object({ body: z.object(promptFields) })
export const updatePromptSchema = z.object({ params: z.object({ id: z.string().min(1) }), body: z.object(promptFields).partial() })
export const promptIdSchema = z.object({ params: z.object({ id: z.string().min(1) }) })