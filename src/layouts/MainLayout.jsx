import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import OfflineBanner from '../components/OfflineBanner'
import InstallPWA from '../components/InstallPWA'
import UpdatePrompt from '../components/UpdatePrompt'

export default function MainLayout() {
  return (
    <div className="app-shell">
      <OfflineBanner />
      <UpdatePrompt />
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <InstallPWA />
    </div>
  )
}
