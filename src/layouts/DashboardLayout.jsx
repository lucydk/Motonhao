import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNavigation from '../components/BottomNavigation'
import OfflineBanner from '../components/OfflineBanner'
import UpdatePrompt from '../components/UpdatePrompt'
import Loading from '../components/Loading'

export default function DashboardLayout() {
  const { role, loading } = useAuth()

  if (loading) return <Loading fullScreen label="Carregando…" />

  return (
    <div className="app-shell dashboard-shell">
      <OfflineBanner />
      <UpdatePrompt />
      <header className="dashboard-topbar">
        <span className="navbar-brand">Moton<span>hão</span></span>
      </header>
      <main className="dashboard-main">
        <Outlet />
      </main>
      {role !== 'admin' ? <BottomNavigation role={role} /> : null}
    </div>
  )
}
