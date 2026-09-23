import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homeRouteFor } from '../config/routes'
import Loading from './Loading'

// Telas de entrar / criar conta: quem já está logado não tem o que fazer aqui,
// então vai direto para o app.
export default function GuestRoute({ children }) {
  const { isAuthenticated, loading, role } = useAuth()

  if (loading) return <Loading fullScreen label="Carregando…" />
  if (isAuthenticated) return <Navigate to={homeRouteFor(role)} replace />

  return children
}
