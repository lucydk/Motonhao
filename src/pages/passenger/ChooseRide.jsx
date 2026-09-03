import { useMemo, useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { estimateRide } from '../../services/rideService'
import Card from '../../components/Card'
import Button from '../../components/Button'

export default function ChooseRide() {
  const location = useLocation()
  const navigate = useNavigate()
  const { origin, destination } = location.state || {}
  const [selected, setSelected] = useState(null)

  const options = useMemo(() => (origin && destination ? estimateRide(origin, destination) : []), [origin, destination])

  if (!origin || !destination) return <Navigate to="/passenger" replace />

  function handleContinue() {
    if (!selected) return
    navigate('/passenger/confirmar', { state: { origin, destination, option: selected } })
  }

  return (
    <div className="page">
      <h1>Escolha sua corrida</h1>
      <p className="page-subtitle">{origin} → {destination}</p>

      <div className="ride-options">
        {options.map((opt) => (
          <Card
            key={opt.rideType}
            className={`ride-option ${selected?.rideType === opt.rideType ? 'is-selected' : ''}`}
            as="button"
            onClick={() => setSelected(opt)}
          >
            <div className="ride-option-icon" aria-hidden="true">
              {opt.rideType === 'economic' ? '🛵' : opt.rideType === 'fast' ? '🏍️' : '🏍️'}
            </div>
            <div className="ride-option-info">
              <strong>{opt.label}</strong>
              <span>{opt.distance} km · {opt.estimatedTime} min</span>
            </div>
            <div className="ride-option-price">R$ {opt.price.toFixed(2)}</div>
          </Card>
        ))}
      </div>

      <Button fullWidth disabled={!selected} onClick={handleContinue}>Continuar</Button>
    </div>
  )
}
