import axios from 'axios'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'
import { ExternalApiError } from '../../utils/AppError.js'

const api = axios.create({ baseURL: 'https://generativelanguage.googleapis.com/v1beta', timeout: 90_000 })
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

function retryDelay(error: unknown, attempt: number) {
  if (axios.isAxiosError(error)) {
    const headers = error.response?.headers
    const retryAfter = headers?.['retry-after']
    if (typeof retryAfter === 'string') {
      const seconds = Number(retryAfter)
      const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now()
      if (Number.isFinite(delay) && delay > 0) return Math.min(delay, 60_000)
    }
    const details = error.response?.data?.error?.details
    if (Array.isArray(details)) {
      const retryInfo = details.find((detail: { '@type'?: string }) => detail?.['@type']?.endsWith('.RetryInfo'))
      const retryDelayValue = retryInfo?.retryDelay
      if (typeof retryDelayValue === 'string') {
        const match = retryDelayValue.match(/^(\d+(?:\.\d+)?)s$/)
        if (match) return Math.min(Number(match[1]) * 1000, 60_000)
      }
    }
  }
  return Math.min(2000 * 2 ** (attempt - 1), 15_000)
}

async function retry<T>(operation: () => Promise<T>, label: string, attempts = 3): Promise<T> {
  let lastError: unknown
  let attemptsMade = 0
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    attemptsMade = attempt
    try { return await operation() }
    catch (error) {
      lastError = error
      const isAxiosError = axios.isAxiosError(error)
      const status = isAxiosError ? error.response?.status : undefined
      const providerMessage = isAxiosError && typeof error.response?.data?.error?.message === 'string' ? error.response.data.error.message : undefined
      const quotaExhausted = status === 429 && /exceeded your current quota|quota exceeded|check your plan and billing/i.test(providerMessage || '')
      const retryable = !isAxiosError || !status || status >= 500 || (status === 429 && !quotaExhausted)
      logger.warn('Gemini request failed', { operation: label, attempt, status, error: isAxiosError ? error.message : String(error), providerMessage })
      if (attempt >= attempts || !retryable) break
      const delay = retryDelay(error, attempt)
      logger.info('Retrying Gemini request after transient failure', { operation: label, attempt, delayMs: delay })
      await wait(delay)
    }
  }
  const providerMessage = axios.isAxiosError(lastError) && typeof lastError.response?.data?.error?.message === 'string' ? lastError.response.data.error.message : undefined
  const message = `Gemini ${label} failed after ${attemptsMade} attempt(s)`
  throw new ExternalApiError(providerMessage ? `${message}: ${providerMessage}` : message, lastError)
}

async function generateText(prompt: string, useGoogleSearch = false): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new ExternalApiError('Gemini API key is not configured')
  return retry(async () => {
    const { data } = await api.post(`/models/${env.GEMINI_MODEL}:generateContent`, { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8 }, ...(useGoogleSearch ? { tools: [{ google_search: {} }] } : {}) }, { params: { key: env.GEMINI_API_KEY } })
    const text = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim()
    if (!text) throw new Error('Gemini returned an empty response')
    return text
  }, 'text generation')
}

export const geminiService = {
  async researchTrends(context: { category: string; audience?: string; language?: string }) {
    return generateText(`Research current YouTube video trends for this topic using Google Search. Summarize useful, verifiable opportunities across these time windows: the last 7 days, 30 days, 90 days, and 12 months. Prioritize current evidence and explain how each trend could inspire an original video; do not copy titles or claim a trend without evidence. Return concise notes with dates and source names. Topic: ${context.category}. Audience: ${context.audience || 'general'}. Language: ${context.language || 'English'}.`, true)
  },
  async enhancePrompt(originalPrompt: string, context: { style?: string; audience?: string; duration?: string; trends?: string } = {}) {
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