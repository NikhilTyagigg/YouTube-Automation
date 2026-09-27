import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthLayout } from './layouts/AuthLayout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { useUserStore } from './store/userStore'
import { useAuthStore } from './store/authStore'
import { authService } from './services/authService'
import { getApiError } from './services/api'
import { useToastStore } from './store/toastStore'
import { ToastViewport } from './components/ToastViewport'

const reportQueryError = (error: unknown) => useToastStore.getState().add(getApiError(error))
const queryClient = new QueryClient({ queryCache: new QueryCache({ onError: reportQueryError }), mutationCache: new MutationCache({ onError: reportQueryError }), defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false }, mutations: { retry: 0 } } })
let sessionRestore: Promise<{ accessToken: string; user: import('./types').User }> | null = null
const AppLayout = lazy(() => import('./layouts/AppLayout').then((module) => ({ default: module.AppLayout })))
const DashboardPage = lazy(() => import('./features/dashboard/DashboardOverview').then((module) => ({ default: module.DashboardOverview })))
const LoginPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.LoginPage })))
const SignupPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.SignupPage })))
const ForgotPasswordPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.ResetPasswordPage })))
const PromptsPage = lazy(() => import('./features/prompts').then((module) => ({ default: module.PromptsPage })))
const EvolutionPage = lazy(() => import('./features/prompts').then((module) => ({ default: module.EvolutionPage })))
const VideosPage = lazy(() => import('./features/videos').then((module) => ({ default: module.VideosPage })))
const MetadataPage = lazy(() => import('./features/videos').then((module) => ({ default: module.MetadataPage })))
const SchedulerPage = lazy(() => import('./features/publishing').then((module) => ({ default: module.SchedulerPage })))
const UploadsPage = lazy(() => import('./features/publishing').then((module) => ({ default: module.UploadsPage })))
const ChannelsPage = lazy(() => import('./features/channels').then((module) => ({ default: module.ChannelsPage })))
const AnalyticsPage = lazy(() => import('./features/analytics').then((module) => ({ default: module.AnalyticsPage })))
const SettingsPage = lazy(() => import('./features/settings').then((module) => ({ default: module.SettingsPage })))
function ThemeSync() {
  const theme = useUserStore((state) => state.theme)
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  return null
}

function RouteTree() {
  return <Suspense fallback={<div className="route-loading"><span className="loading-mark" />Opening your studio...</div>}><Routes>
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Route>
    <Route element={<ProtectedRoute />}><Route element={<AppLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="prompts" element={<PromptsPage />} />
      <Route path="evolution" element={<EvolutionPage />} />
      <Route path="videos" element={<VideosPage />} />
      <Route path="scheduler" element={<SchedulerPage />} />
      <Route path="uploads" element={<UploadsPage />} />
      <Route path="metadata" element={<MetadataPage />} />
      <Route path="channels" element={<ChannelsPage />} />
      <Route path="analytics" element={<AnalyticsPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>
}

function SessionBootstrap() {
  const setSession = useAuthStore((state) => state.setSession)
  const signOut = useAuthStore((state) => state.signOut)
  const setBootstrapped = useAuthStore((state) => state.setBootstrapped)
  useEffect(() => {
    let active = true
    sessionRestore ??= authService.refresh().then(({ data }) => data).finally(() => { sessionRestore = null })
    void sessionRestore.then((session) => {
      if (active) setSession(session.accessToken, session.user)
    }).catch((error: unknown) => {
      signOut()
      if (import.meta.env.DEV && !String(getApiError(error)).includes('401')) console.info('No saved Framewise session to restore.')
    }).finally(() => { if (active) setBootstrapped(true) })
    return () => { active = false }
  }, [setBootstrapped, setSession, signOut])
  return null
}

export default function App() {
  return <QueryClientProvider client={queryClient}><SessionBootstrap /><ThemeSync /><RouteTree /><ToastViewport /></QueryClientProvider>
}