import { Link } from 'react-router-dom'
import { getDriverShare } from '../config/platformConfig'
import Avatar from './Avatar'

const RIDE_TYPE_LABEL = { economic: 'Econômico', standard: 'Padrão', fast: 'Rápido' }
const STATUS_LABEL = {
  searching: 'Procurando',
  accepted: 'Aceita',
  driver_arriving: 'Motociclista a caminho',
  in_progress: 'Em viagem',
  completed: 'Concluída',
  cancelled: 'Cancelada'
}

// forDriver: quando true, mostra a parte do motorista (75%) em vez do valor
// total que o passageiro paga — usado nas telas do motociclista.
export default function RideCard({ ride, onAccept, onDecline, showActions = false, forDriver = false }) {
  const date = new Date(ride.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  const displayPrice = forDriver ? getDriverShare(ride.price) : Number(ride.price)

  // Nas corridas abertas, mostra quanto tempo ainda resta pro pedido expirar.
  const minutesLeft =
    ride.status === 'searching' && ride.expires_at
      ? Math.max(0, Math.ceil((new Date(ride.expires_at).getTime() - Date.now()) / 60000))
      : null

  return (
    <div className="ride-card">
      <div className="ride-card-top">
        <span className={`ride-card-badge badge-${ride.status}`}>{STATUS_LABEL[ride.status] || ride.status}</span>
        <span className="ride-card-date">
          {minutesLeft != null ? `expira em ${minutesLeft} min · ` : ''}{date}
        </span>
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
        <strong>R$ {displayPrice.toFixed(2)}</strong>
      </div>

      {ride.driver?.profile ? (
        <Link to={`/perfil/${ride.driver.profile.id}`} className="ride-card-driver is-clickable">
          <Avatar src={ride.driver.profile.avatar_url} name={ride.driver.profile.full_name} size={30} />
          <span>Motociclista: {ride.driver.profile.full_name} · {ride.driver.motorcycle_model} · {ride.driver.license_plate}</span>
        </Link>
      ) : null}

      {ride.passenger ? (
        <Link to={`/perfil/${ride.passenger.id}`} className="ride-card-driver is-clickable">
          <Avatar src={ride.passenger.avatar_url} name={ride.passenger.full_name} size={30} />
          <span>Passageiro: {ride.passenger.full_name}</span>
        </Link>
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
