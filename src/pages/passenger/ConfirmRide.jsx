import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useRide } from '../../context/RideContext'
import { createRide } from '../../services/rideService'
import { useToast } from '../../context/ToastContext'
import Card from '../../components/Card'
import Button from '../../components/Button'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Dinheiro', icon: '💵' },
  { value: 'pix', label: 'Pix', icon: '💠' },
  { value: 'card', label: 'Cartão', icon: '💳' }
]

export default function ConfirmRide() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { watchRide } = useRide()
  const { showToast } = useToast()
  const { origin, destination, option } = location.state || {}
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!origin || !destination || !option) return <Navigate to="/passenger" replace />

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      const ride = await createRide({
        passengerId: user.id,
        origin,
        destination,
        distance: option.distance,
        estimatedTime: option.estimatedTime,
        price: option.price,
        rideType: option.rideType,
        paymentMethod
      })
      await watchRide(ride.id)
      showToast('Procurando um motociclista para você…', 'info')
      navigate('/passenger/corrida-ativa', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h1>Confirmar corrida?</h1>

      <Card className="confirm-card">
        <div className="confirm-row"><span>Origem</span><strong>{origin}</strong></div>
        <div className="confirm-row"><span>Destino</span><strong>{destination}</strong></div>
        <div className="confirm-row"><span>Distância</span><strong>{option.distance} km</strong></div>
        <div className="confirm-row"><span>Tempo estimado</span><strong>{option.estimatedTime} min</strong></div>
        <div className="confirm-row"><span>Motociclista</span><strong>Ainda não definido</strong></div>
        <div className="confirm-row confirm-row-price"><span>Preço</span><strong>R$ {option.price.toFixed(2)}</strong></div>
      </Card>

      <Card>
        <h2>Forma de pagamento</h2>
        <div className="payment-methods">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`payment-method ${paymentMethod === m.value ? 'is-selected' : ''}`}
              onClick={() => setPaymentMethod(m.value)}
            >
              <span aria-hidden="true">{m.icon}</span> {m.label}
            </button>
          ))}
        </div>
      </Card>

      {error ? <p className="form-error">{error}</p> : null}

      <Button fullWidth loading={loading} onClick={handleConfirm}>Confirmar corrida</Button>
    </div>
  )
}
