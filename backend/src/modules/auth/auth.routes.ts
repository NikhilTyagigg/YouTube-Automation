import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { login, logout, refresh, register } from './auth.controller.js'
import { loginSchema, registerSchema } from './auth.validation.js'

export const authRoutes = Router()
authRoutes.post('/register', validate(registerSchema), register)
authRoutes.post('/login', validate(loginSchema), login)
authRoutes.post('/refresh', refresh)
authRoutes.post('/logout', logout)