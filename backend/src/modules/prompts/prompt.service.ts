import { NotFoundError } from '../../utils/AppError.js'
import { promptRepository } from './prompt.repository.js'

export const promptService = {
  async list(userId: string) { return promptRepository.listByUser(userId) },
  async get(userId: string, id: string) {
    const prompt = await promptRepository.findById(userId, id)
    if (!prompt) throw new NotFoundError('Prompt template')
    return prompt
  },
  async create(userId: string, data: { name: string; category: string; basePrompt: string; language?: string; style?: string; targetAudience?: string; duration?: string; isActive?: boolean }) {
    return promptRepository.create(userId, { ...data, language: data.language ?? 'English', style: data.style ?? 'Cinematic', targetAudience: data.targetAudience ?? '', duration: data.duration ?? '60 sec', isActive: data.isActive ?? true })
  },
  async update(userId: string, id: string, data: Record<string, unknown>) {
    await this.get(userId, id)
    return promptRepository.update(userId, id, data)
  },
  async remove(userId: string, id: string) {
    await this.get(userId, id)
    await promptRepository.delete(userId, id)
  },
}