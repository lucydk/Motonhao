import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homeRouteFor } from '../config/routes'
import BottomNavigation from '../components/BottomNavigation'
import OfflineBanner from '../components/OfflineBanner'
import UpdatePrompt from '../components/UpdatePrompt'
import Loading from '../components/Loading'
import Logo from '../components/Logo'
import Avatar from '../components/Avatar'
import SignOutButton from '../components/SignOutButton'

const PROFILE_ROUTE = {
  passenger: '/passenger/profile',
  driver: '/driver/profile'
}

export default function DashboardLayout() {
  const { role, profile, loading } = useAuth()

  if (loading) return <Loading fullScreen label="Carregando…" />

  return (
    <div className="app-shell dashboard-shell">
      <OfflineBanner />
      <UpdatePrompt />
      <header className="dashboard-topbar">
        <Logo to={homeRouteFor(role)} />

        <div className="dashboard-topbar-actions">
          {/* Sair fica no topo de TODAS as telas: dá pra encerrar a sessão
              de onde a pessoa estiver, sem voltar até a tela inicial. */}
          <SignOutButton />

          {PROFILE_ROUTE[role] ? (
            <Link to={PROFILE_ROUTE[role]} className="topbar-avatar" aria-label="Meu perfil">
              <Avatar src={profile?.avatar_url} name={profile?.full_name || ''} size={38} />
            </Link>
          ) : null}
        </div>
      </header>
      <main className="dashboard-main">
        <Outlet />
      </main>
      {role !== 'admin' ? <BottomNavigation role={role} /> : null}
    </div>
  )
}
