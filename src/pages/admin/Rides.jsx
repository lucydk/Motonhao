import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Loading from '../../components/Loading'

const STATUS_LABEL = {
  searching: 'Procurando', accepted: 'Aceita', driver_arriving: 'A caminho',
  in_progress: 'Em viagem', completed: 'Concluída', cancelled: 'Cancelada'
}

export default function Rides() {
  const [rides, setRides] = useState(null)

  useEffect(() => {
    supabase
      .from('rides')
      .select('*, passenger:profiles!rides_passenger_id_fkey(full_name), driver:drivers(profile:profiles(full_name))')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => setRides(data || []))
  }, [])

  if (!rides) return <Loading fullScreen label="Carregando corridas…" />

  return (
    <div className="page">
      <h1>Corridas</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Data</th><th>Passageiro</th><th>Motociclista</th><th>Origem</th><th>Destino</th><th>Valor</th><th>Status</th></tr>
          </thead>
          <tbody>
            {rides.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                <td>{r.passenger?.full_name}</td>
                <td>{r.driver?.profile?.full_name || '—'}</td>
                <td>{r.origin}</td>
                <td>{r.destination}</td>
                <td>R$ {Number(r.price).toFixed(2)}</td>
                <td><span className={`ride-card-badge badge-${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
