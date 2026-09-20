import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import Plate from './Plate'

// Cartão do motociclista. Clicando nele, o passageiro abre o perfil
// completo (avaliações escritas, corridas, dados da moto).
export default function DriverCard({ driver }) {
  if (!driver) return null
  const name = driver.profile?.full_name || 'Motociclista'
  const profileId = driver.profile?.id || driver.profile_id

  const content = (
    <>
      <Avatar src={driver.profile?.avatar_url} name={name} size={72} ring />
      <div className="driver-card-info">
        <strong>{name}</strong>
        <span>⭐ {Number(driver.rating).toFixed(1)} · {driver.total_rides} corridas</span>
        <span>{driver.motorcycle_brand} {driver.motorcycle_model} · {driver.motorcycle_color}</span>
        <Plate value={driver.license_plate} />
        {profileId ? <span className="card-link-hint">ver perfil e avaliações →</span> : null}
      </div>
    </>
  )

  if (!profileId) return <div className="driver-card">{content}</div>

  return (
    <Link to={`/perfil/${profileId}`} className="driver-card is-clickable">
      {content}
    </Link>
  )
}
