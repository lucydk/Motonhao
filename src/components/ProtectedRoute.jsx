import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, role } = useAuth()

  if (loading) return <Loading fullScreen label="Carregando sua conta…" />

  if (!isAuthenticated) return <Navigate to="/entrar" replace />

  if (allowedRoles && !allowedRoles.includes(role)) {
    const fallback = role === 'driver' ? '/driver' : role === 'admin' ? '/admin' : '/passenger'
    return <Navigate to={fallback} replace />
  }

  return children
}
