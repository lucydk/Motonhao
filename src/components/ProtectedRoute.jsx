import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasAllDocuments } from '../services/documentService'
import { homeRouteFor } from '../config/routes'
import Loading from './Loading'

// skipPhotoCheck: só a própria tela de foto usa, senão ela redirecionaria pra si mesma.
export default function ProtectedRoute({ children, allowedRoles, skipPhotoCheck = false, skipDocumentsCheck = false }) {
  const { isAuthenticated, loading, role, profile, driver } = useAuth()
  const location = useLocation()

  if (loading) return <Loading fullScreen label="Carregando sua conta…" />

  if (!isAuthenticated) return <Navigate to="/entrar" replace />

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={homeRouteFor(role)} replace />
  }

  // Passageiro e motociclista precisam ter foto para usar o app.
  const needsPhoto = profile && profile.role !== 'admin' && !profile.avatar_url
  if (needsPhoto && !skipPhotoCheck) {
    return <Navigate to="/foto" replace state={{ from: location.pathname }} />
  }

  // Motociclista precisa ter enviado CNH, foto da moto e CRLV.
  // (Quem se cadastrou antes dessa etapa existir também passa por aqui uma vez.)
  const needsDocuments = role === 'driver' && driver && !hasAllDocuments(driver)
  if (needsDocuments && !skipDocumentsCheck && !needsPhoto) {
    return <Navigate to="/documentos" replace />
  }

  return children
}
