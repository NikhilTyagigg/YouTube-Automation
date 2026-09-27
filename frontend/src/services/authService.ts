import { api } from './api'
import type { User } from '../types'

export const authService = {
  login: (email: string, password: string) => api.post<{ accessToken: string; user: User }>('/auth/login', { email, password }),
  signup: (name: string, email: string, password: string) => api.post<{ accessToken: string; user: User }>('/auth/register', { name, email, password }),
  refresh: () => api.post<{ accessToken: string; user: User }>('/auth/refresh'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  logout: () => api.post('/auth/logout'),
  profile: () => api.get<User>('/users/me'),
}