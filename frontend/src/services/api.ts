import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const api = axios.create({ baseURL, timeout: 15000, withCredentials: true, headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshInFlight: Promise<string | null> | null = null
api.interceptors.response.use((response) => {
  if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) response.data = response.data.data
  return response
}, async (error: AxiosError) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
  if (error.response?.status === 401 && original && !original._retry) {
    original._retry = true
    const token = useAuthStore.getState().token
    if (token && !token.startsWith('demo-')) {
      refreshInFlight ??= axios.post<{ success: boolean; data: { accessToken: string } }>(`${baseURL}/auth/refresh`, undefined, { withCredentials: true }).then(({ data }) => data.data.accessToken).catch(() => null).finally(() => { refreshInFlight = null })
      const freshToken = await refreshInFlight
      if (freshToken) { useAuthStore.getState().setToken(freshToken); original.headers.Authorization = `Bearer ${freshToken}`; return api(original) }
    }
    useAuthStore.getState().signOut()
  }
  return Promise.reject(error)
})

export function getApiError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string; error?: { message?: string } }>(error)) return error.response?.data?.error?.message || error.response?.data?.message || error.message || 'The request could not be completed.'
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}