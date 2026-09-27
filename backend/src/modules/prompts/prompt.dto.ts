import type { PromptTemplate } from '@prisma/client'

export function toPromptDto(prompt: PromptTemplate) {
  return {
    id: prompt.id,
    name: prompt.name,
    category: prompt.category,
    basePrompt: prompt.basePrompt,
    language: prompt.language,
    style: prompt.style,
    targetAudience: prompt.targetAudience,
    duration: prompt.duration,
    active: prompt.isActive,
    updatedAt: prompt.updatedAt.toISOString(),
    createdAt: prompt.createdAt.toISOString(),
  }
}