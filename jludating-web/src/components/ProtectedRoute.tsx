import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/use-auth-store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * 路由守卫：未登录用户访问受保护页面时重定向到登录页
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const session = useAuthStore((s) => s.session)
  if (!session?.accessToken) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
