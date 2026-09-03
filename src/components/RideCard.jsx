const RIDE_TYPE_LABEL = { economic: 'Econômico', standard: 'Padrão', fast: 'Rápido' }
const STATUS_LABEL = {
  searching: 'Procurando',
  accepted: 'Aceita',
  driver_arriving: 'Motociclista a caminho',
  in_progress: 'Em viagem',
  completed: 'Concluída',
  cancelled: 'Cancelada'
}

export default function RideCard({ ride, onAccept, onDecline, showActions = false }) {
  const date = new Date(ride.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="ride-card">
      <div className="ride-card-top">
        <span className={`ride-card-badge badge-${ride.status}`}>{STATUS_LABEL[ride.status] || ride.status}</span>
        <span className="ride-card-date">{date}</span>
      </div>

      <div className="ride-card-route">
        <div className="ride-card-point">
          <span className="dot dot-origin" /> {ride.origin}
        </div>
        <div className="ride-card-point">
          <span className="dot dot-destination" /> {ride.destination}
        </div>
      </div>

      <div className="ride-card-meta">
        <span>{RIDE_TYPE_LABEL[ride.ride_type] || ride.ride_type}</span>
        <span>{ride.distance} km</span>
        <span>{ride.estimated_time} min</span>
        <strong>R$ {Number(ride.price).toFixed(2)}</strong>
      </div>

      {ride.driver?.profile ? (
        <div className="ride-card-driver">
          Motociclista: {ride.driver.profile.full_name} · {ride.driver.motorcycle_model} · {ride.driver.license_plate}
        </div>
      ) : null}

      {ride.passenger ? (
        <div className="ride-card-driver">Passageiro: {ride.passenger.full_name}</div>
      ) : null}

      {showActions ? (
        <div className="ride-card-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => onDecline?.(ride)}>Recusar</button>
          <button className="btn btn-primary btn-sm" onClick={() => onAccept?.(ride)}>Aceitar</button>
        </div>
      ) : null}
    </div>
  )
}
