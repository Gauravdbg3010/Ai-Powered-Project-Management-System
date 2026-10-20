import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../store/authContext'

interface PrivateRouteProps {
  requiredRole?: 'MANAGER' | 'EMPLOYEE'
}

export function PrivateRoute({ requiredRole }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/access-denied" replace />
  return <Outlet />
}
