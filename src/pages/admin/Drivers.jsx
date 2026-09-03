import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Loading from '../../components/Loading'

export default function Drivers() {
  const [drivers, setDrivers] = useState(null)

  useEffect(() => {
    supabase
      .from('drivers')
      .select('*, profile:profiles(full_name, email, phone)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setDrivers(data || []))
  }, [])

  if (!drivers) return <Loading fullScreen label="Carregando motociclistas…" />

  return (
    <div className="page">
      <h1>Motociclistas</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Nome</th><th>Moto</th><th>Placa</th><th>Avaliação</th><th>Corridas</th><th>Status</th></tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id}>
                <td>{d.profile?.full_name}</td>
                <td>{d.motorcycle_brand} {d.motorcycle_model}</td>
                <td>{d.license_plate}</td>
                <td>⭐ {Number(d.rating).toFixed(1)}</td>
                <td>{d.total_rides}</td>
                <td>{d.is_online ? <span className="status-online">Online</span> : <span className="status-offline">Offline</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
