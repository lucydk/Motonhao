import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRide } from '../../context/RideContext'
import { useAuth } from '../../context/AuthContext'
import { updateRideStatus, cancelRide, updateDriverLocation } from '../../services/rideService'
import { getDriverShare } from '../../config/platformConfig'
import { useToast } from '../../context/ToastContext'
import { useRideRoute } from '../../hooks/useRideRoute'
import MapReal from '../../components/MapReal'
import RideStatus from '../../components/RideStatus'
import RideChat from '../../components/RideChat'
import Card from '../../components/Card'
import PassengerCard from '../../components/PassengerCard'
import Button from '../../components/Button'
import Loading from '../../components/Loading'

const NEXT_STATUS = {
  accepted: { next: 'driver_arriving', label: 'Cheguei ao local de embarque' },
  driver_arriving: { next: 'in_progress', label: 'Iniciar viagem' },
  in_progress: { next: 'completed', label: 'Finalizar corrida' }
}

const LIVE_STATUSES = ['accepted', 'driver_arriving', 'in_progress']

export default function DriverActiveRide() {
  const { activeRide, clearRide } = useRide()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const lastSentRef = useRef(0)

  const { origin, destination, routePath, loading: routeLoading, error: routeError } = useRideRoute(activeRide)

  const rideId = activeRide?.id
  const isLive = LIVE_STATUSES.includes(activeRide?.status)

  // Enquanto a corrida está ativa, manda a posição do GPS para o passageiro
  // acompanhar a moto no mapa. Envia no máximo uma vez a cada 8 segundos
  // para não pesar na conexão nem no banco.
  useEffect(() => {
    if (!rideId || !isLive || !navigator.geolocation) return undefined

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now()
        if (now - lastSentRef.current < 8000) return
        lastSentRef.current = now
        updateDriverLocation(rideId, { lat: pos.coords.latitude, lon: pos.coords.longitude }).catch(() => {
          // Sem internet no momento: tenta de novo na próxima leitura do GPS
        })
      },
      () => {
        // Sem permissão de localização: a corrida segue normal, só sem a moto no mapa
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [rideId, isLive])

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

  const vehicle =
    activeRide.driver_lat != null && activeRide.driver_lng != null
      ? { lat: activeRide.driver_lat, lon: activeRide.driver_lng }
      : null

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

      {routeLoading && !origin ? (
        <Loading label="Abrindo o mapa da corrida…" />
      ) : (
        <MapReal
          origin={origin}
          destination={destination}
          vehicle={vehicle}
          routePath={routePath}
          height={300}
          zoom={15}
        />
      )}

      {routeError ? <p className="map-caption">{routeError}</p> : null}

      <RideStatus status={activeRide.status} />

      <PassengerCard passenger={activeRide.passenger} />

      {isLive ? (
        <RideChat
          rideId={activeRide.id}
          currentUserId={user.id}
          role="driver"
          otherName={activeRide.passenger?.full_name}
        />
      ) : null}

      <Card>
        <div className="confirm-row"><span>Origem</span><strong>{activeRide.origin}</strong></div>
        <div className="confirm-row"><span>Destino</span><strong>{activeRide.destination}</strong></div>
        <div className="confirm-row"><span>Pagamento</span><strong>{
          activeRide.payment_method === 'cash' ? 'Dinheiro' : activeRide.payment_method === 'pix' ? 'Pix' : 'Cartão'
        }</strong></div>
        <div className="confirm-row confirm-row-price"><span>Valor</span><strong>R$ {getDriverShare(activeRide.price).toFixed(2)}</strong></div>
      </Card>

      {step ? <Button fullWidth onClick={handleAdvance}>{step.label}</Button> : null}

      {['accepted', 'driver_arriving'].includes(activeRide.status) ? (
        <Button variant="secondary" fullWidth onClick={handleCancel}>Cancelar corrida</Button>
      ) : null}
    </div>
  )
}
