export default function DriverCard({ driver }) {
  if (!driver) return null
  const name = driver.profile?.full_name || 'Motociclista'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="driver-card">
      <div className="driver-card-avatar" aria-hidden="true">{initial}</div>
      <div className="driver-card-info">
        <strong>{name}</strong>
        <span>⭐ {Number(driver.rating).toFixed(1)} · {driver.total_rides} corridas</span>
        <span>{driver.motorcycle_brand} {driver.motorcycle_model} · {driver.motorcycle_color}</span>
        <span className="driver-card-plate">{driver.license_plate}</span>
      </div>
    </div>
  )
}
