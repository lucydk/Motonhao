import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Card from '../../components/Card'
import Loading from '../../components/Loading'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      const [profiles, drivers, rides] = await Promise.all([
        supabase.from('profiles').select('id, role', { count: 'exact' }),
        supabase.from('drivers').select('id', { count: 'exact' }),
        supabase.from('rides').select('id, status, price')
      ])

      const totalUsers = profiles.count ?? profiles.data?.length ?? 0
      const totalDrivers = drivers.count ?? drivers.data?.length ?? 0
      const ridesData = rides.data || []
      const inProgress = ridesData.filter((r) => ['accepted', 'driver_arriving', 'in_progress', 'searching'].includes(r.status)).length
      const completed = ridesData.filter((r) => r.status === 'completed').length
      const cancelled = ridesData.filter((r) => r.status === 'cancelled').length
      const revenue = ridesData.filter((r) => r.status === 'completed').reduce((sum, r) => sum + Number(r.price), 0)

      setStats({ totalUsers, totalDrivers, totalRides: ridesData.length, inProgress, completed, cancelled, revenue })
    }
    load()
  }, [])

  if (!stats) return <Loading fullScreen label="Carregando painel administrativo…" />

  return (
    <div className="page">
      <h1>Painel administrativo</h1>

      <div className="admin-stats-grid">
        <Card className="stat-card"><span>Usuários</span><strong>{stats.totalUsers}</strong></Card>
        <Card className="stat-card"><span>Motociclistas</span><strong>{stats.totalDrivers}</strong></Card>
        <Card className="stat-card"><span>Corridas totais</span><strong>{stats.totalRides}</strong></Card>
        <Card className="stat-card"><span>Em andamento</span><strong>{stats.inProgress}</strong></Card>
        <Card className="stat-card"><span>Finalizadas</span><strong>{stats.completed}</strong></Card>
        <Card className="stat-card"><span>Canceladas</span><strong>{stats.cancelled}</strong></Card>
        <Card className="stat-card stat-card-wide"><span>Faturamento</span><strong>R$ {stats.revenue.toFixed(2)}</strong></Card>
      </div>

      <div className="admin-links">
        <Link className="btn btn-outline" to="/admin/usuarios">Ver usuários</Link>
        <Link className="btn btn-outline" to="/admin/motociclistas">Ver motociclistas</Link>
        <Link className="btn btn-outline" to="/admin/corridas">Ver corridas</Link>
      </div>
    </div>
  )
}
