import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createPrompt, deletePrompt, getPrompt, listPrompts, updatePrompt } from './prompt.controller.js'
import { createPromptSchema, promptIdSchema, updatePromptSchema } from './prompt.validation.js'

export const promptRoutes = Router()
promptRoutes.use(authenticate)
promptRoutes.get('/', listPrompts)
promptRoutes.get('/:id', validate(promptIdSchema), getPrompt)
promptRoutes.post('/', validate(createPromptSchema), createPrompt)
promptRoutes.put('/:id', validate(updatePromptSchema), updatePrompt)
promptRoutes.delete('/:id', validate(promptIdSchema), deletePrompt)