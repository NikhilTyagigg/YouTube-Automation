import type { Request, Response } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { promptService } from './prompt.service.js'
import { toPromptDto } from './prompt.dto.js'
import { routeParam } from '../../utils/routeParam.js'

export const listPrompts = asyncHandler(async (request: Request, response: Response) => {
  const prompts = await promptService.list(request.user!.id)
  response.json({ success: true, data: prompts.map(toPromptDto) })
})
export const getPrompt = asyncHandler(async (request: Request, response: Response) => {
  const prompt = await promptService.get(request.user!.id, routeParam(request, 'id'))
  response.json({ success: true, data: toPromptDto(prompt) })
})
export const createPrompt = asyncHandler(async (request: Request, response: Response) => {
  const prompt = await promptService.create(request.user!.id, request.body)
  response.status(201).json({ success: true, data: toPromptDto(prompt) })
})
export const updatePrompt = asyncHandler(async (request: Request, response: Response) => {
  const prompt = await promptService.update(request.user!.id, routeParam(request, 'id'), request.body)
  response.json({ success: true, data: toPromptDto(prompt) })
})
export const deletePrompt = asyncHandler(async (request: Request, response: Response) => {
  await promptService.remove(request.user!.id, routeParam(request, 'id'))
  response.status(204).end()
})