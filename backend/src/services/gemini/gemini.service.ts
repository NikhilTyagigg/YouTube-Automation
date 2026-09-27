import axios from 'axios'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import { ExternalApiError } from '../../utils/AppError.js'

const api = axios.create({ baseURL: 'https://generativelanguage.googleapis.com/v1beta', timeout: 90_000 })
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function retry<T>(operation: () => Promise<T>, label: string, attempts = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await operation() }
    catch (error) {
      lastError = error
      logger.warn('Gemini request failed', { operation: label, attempt, error: axios.isAxiosError(error) ? error.message : String(error) })
      if (attempt < attempts) await wait(400 * 2 ** (attempt - 1))
    }
  }
  throw new ExternalApiError(`Gemini ${label} failed after ${attempts} attempts`, lastError)
}

async function generateText(prompt: string): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new ExternalApiError('Gemini API key is not configured')
  return retry(async () => {
    const { data } = await api.post(`/models/${env.GEMINI_MODEL}:generateContent`, { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8 } }, { params: { key: env.GEMINI_API_KEY } })
    const text = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim()
    if (!text) throw new Error('Gemini returned an empty response')
    return text
  }, 'text generation')
}

export const geminiService = {
  async enhancePrompt(originalPrompt: string, context: { style?: string; audience?: string; duration?: string } = {}) {
    return generateText(`Enhance this video-generation prompt. Preserve the intent, add a human-centered story arc, specific visual direction, pacing, and useful constraints. Return only the improved prompt.\nContext: ${JSON.stringify(context)}\nPrompt: ${originalPrompt}`)
  },
  async generateTitle(prompt: string) { return generateText(`Write one concise, compelling YouTube title, under 70 characters, for this video. Return only the title.\n${prompt}`) },
  async generateDescription(prompt: string) { return generateText(`Write a helpful YouTube video description with a natural call to action. Return only the description.\n${prompt}`) },
  async generateHashtags(prompt: string): Promise<string[]> {
    const response = await generateText(`Return 5 relevant YouTube hashtags as a comma-separated list, without prose.\n${prompt}`)
    return response.split(/[\s,]+/).map((tag) => tag.replace(/^#/, '').replace(/[^\p{L}\p{N}_]/gu, '')).filter(Boolean).slice(0, 15)
  },
  async generateVideo(prompt: string) {
    if (!env.GEMINI_API_KEY) throw new ExternalApiError('Gemini API key is not configured')
    return retry(async () => {
      const { data } = await api.post(`/models/${env.GEMINI_VIDEO_MODEL}:predictLongRunning`, { instances: [{ prompt }], parameters: { aspectRatio: '16:9' } }, { params: { key: env.GEMINI_API_KEY }, timeout: 120_000 })
      if (!data.name) throw new Error('Gemini did not return a video operation ID')
      return { operationName: data.name as string }
    }, 'video generation')
  },
  async waitForVideo(operationName: string, timeoutMs = 20 * 60_000) {
    const started = Date.now()
    while (Date.now() - started < timeoutMs) {
      const { data } = await api.get(`/${operationName}`, { params: { key: env.GEMINI_API_KEY }, timeout: 30_000 })
      if (data.done) {
        if (data.error) throw new ExternalApiError('Gemini video generation failed', data.error)
        return data.response
      }
      await wait(10_000)
    }
    throw new ExternalApiError('Gemini video generation timed out')
  },
}