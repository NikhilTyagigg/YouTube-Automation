import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const token = useAuthStore((state) => state.token)
  const role = useAuthStore((state) => state.user?.role)
  const bootstrapped = useAuthStore((state) => state.bootstrapped)
  const location = useLocation()
  if (!bootstrapped) return <div className="route-loading"><span className="loading-mark" />Restoring your session...</div>
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/" replace />
  return <Outlet />
}