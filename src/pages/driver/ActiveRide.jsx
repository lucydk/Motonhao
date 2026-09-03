import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRide } from '../../context/RideContext'
import { updateRideStatus, cancelRide } from '../../services/rideService'
import { useToast } from '../../context/ToastContext'
import MapMock from '../../components/MapMock'
import RideStatus from '../../components/RideStatus'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Loading from '../../components/Loading'

const NEXT_STATUS = {
  accepted: { next: 'driver_arriving', label: 'Cheguei ao local de embarque' },
  driver_arriving: { next: 'in_progress', label: 'Iniciar viagem' },
  in_progress: { next: 'completed', label: 'Finalizar corrida' }
}

export default function DriverActiveRide() {
  const { activeRide, clearRide } = useRide()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (activeRide?.status === 'completed' || activeRide?.status === 'cancelled') {
      const t = setTimeout(() => {
        clearRide()
        navigate('/driver', { replace: true })
      }, 1600)
      return () => clearTimeout(t)
    }
  }, [activeRide?.status, clearRide, navigate])

  useEffect(() => {
    if (!activeRide) {
      const t = setTimeout(() => navigate('/driver', { replace: true }), 300)
      return () => clearTimeout(t)
    }
  }, [activeRide, navigate])

  if (!activeRide) return <Loading fullScreen label="Carregando corrida…" />

  const step = NEXT_STATUS[activeRide.status]

  async function handleAdvance() {
    try {
      await updateRideStatus(activeRide.id, step.next)
      if (step.next === 'completed') showToast('Corrida finalizada!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleCancel() {
    try {
      await cancelRide(activeRide.id)
      showToast('Corrida cancelada.', 'info')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="page">
      <h1>Corrida em andamento</h1>

      <MapMock origin={activeRide.origin} destination={activeRide.destination} status={activeRide.status} />
      <RideStatus status={activeRide.status} />

      <Card>
        <div className="confirm-row"><span>Passageiro</span><strong>{activeRide.passenger?.full_name}</strong></div>
        <div className="confirm-row"><span>Origem</span><strong>{activeRide.origin}</strong></div>
        <div className="confirm-row"><span>Destino</span><strong>{activeRide.destination}</strong></div>
        <div className="confirm-row"><span>Pagamento</span><strong>{
          activeRide.payment_method === 'cash' ? 'Dinheiro' : activeRide.payment_method === 'pix' ? 'Pix' : 'Cartão'
        }</strong></div>
        <div className="confirm-row confirm-row-price"><span>Valor</span><strong>R$ {Number(activeRide.price).toFixed(2)}</strong></div>
      </Card>

      {step ? <Button fullWidth onClick={handleAdvance}>{step.label}</Button> : null}

      {['accepted', 'driver_arriving'].includes(activeRide.status) ? (
        <Button variant="secondary" fullWidth onClick={handleCancel}>Cancelar corrida</Button>
      ) : null}
    </div>
  )
}
