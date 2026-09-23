import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRide } from '../../context/RideContext'
import { useAuth } from '../../context/AuthContext'
import { cancelRide, expireRide } from '../../services/rideService'
import { submitRating } from '../../services/ratingService'
import { useToast } from '../../context/ToastContext'
import { useRideRoute } from '../../hooks/useRideRoute'
import MapReal from '../../components/MapReal'
import RideStatus from '../../components/RideStatus'
import RideCountdown from '../../components/RideCountdown'
import RideChat from '../../components/RideChat'
import DriverCard from '../../components/DriverCard'
import Rating from '../../components/Rating'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import Loading from '../../components/Loading'

const CHAT_STATUSES = ['accepted', 'driver_arriving', 'in_progress']

export default function ActiveRide() {
  const { activeRide, clearRide } = useRide()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [cancelling, setCancelling] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)
  const [comment, setComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const expiredRef = useRef(false)

  const { origin, destination, routePath, loading: routeLoading, error: routeError } = useRideRoute(activeRide)

  useEffect(() => {
    if (!activeRide) {
      const t = setTimeout(() => navigate('/passenger', { replace: true }), 300)
      return () => clearTimeout(t)
    }
  }, [activeRide, navigate])

  // Corrida cancelada (pelo motociclista ou por tempo esgotado): avisa e volta.
  useEffect(() => {
    if (activeRide?.status !== 'cancelled') return undefined
    const t = setTimeout(() => {
      clearRide()
      navigate('/passenger', { replace: true })
    }, 2200)
    return () => clearTimeout(t)
  }, [activeRide?.status, clearRide, navigate])

  if (!activeRide) return <Loading fullScreen label="Carregando corrida…" />

  // Chamado pelo contador quando o prazo acaba: fecha o pedido no banco.
  async function handleExpired() {
    if (expiredRef.current || activeRide.status !== 'searching') return
    expiredRef.current = true
    try {
      await expireRide(activeRide.id)
      showToast('Nenhum motociclista aceitou a tempo. Pedido cancelado.', 'info')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      await cancelRide(activeRide.id)
      showToast('Corrida cancelada.', 'info')
      clearRide()
      navigate('/passenger', { replace: true })
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setCancelling(false)
    }
  }

  async function handleSubmitRating() {
    setSubmittingRating(true)
    try {
      await submitRating({
        rideId: activeRide.id,
        passengerId: user.id,
        driverId: activeRide.driver_id,
        rating: ratingValue,
        comment
      })
      showToast('Obrigado pela avaliação!', 'success')
      clearRide()
      navigate('/passenger', { replace: true })
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmittingRating(false)
    }
  }

  const canCancel = ['searching', 'accepted'].includes(activeRide.status)
  const showChat = CHAT_STATUSES.includes(activeRide.status) && activeRide.driver_id

  // Posição ao vivo da moto (o motociclista envia enquanto a corrida corre)
  const vehicle =
    activeRide.driver_lat != null && activeRide.driver_lng != null
      ? { lat: activeRide.driver_lat, lon: activeRide.driver_lng }
      : null

  return (
    <div className="page">
      {activeRide.status === 'searching' ? (
        <div className="searching-block">
          <span className="searching-spinner" aria-hidden="true" />
          <h1>Procurando motociclista…</h1>
          <p>Assim que um motociclista aceitar, você será avisado automaticamente.</p>
        </div>
      ) : (
        <h1>Sua corrida</h1>
      )}

      {activeRide.status === 'searching' ? (
        <RideCountdown expiresAt={activeRide.expires_at} onExpire={handleExpired} />
      ) : null}

      {activeRide.status === 'cancelled' ? (
        <p className="form-error">Esta corrida foi cancelada. Voltando para a tela inicial…</p>
      ) : null}

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
      {vehicle ? <p className="map-caption">🏍️ Posição do motociclista em tempo real.</p> : null}

      <RideStatus status={activeRide.status} />

      {activeRide.driver ? (
        <>
          {activeRide.status === 'accepted' ? <p className="found-banner">Motociclista encontrado!</p> : null}
          <DriverCard driver={activeRide.driver} />
        </>
      ) : null}

      {showChat ? (
        <RideChat
          rideId={activeRide.id}
          currentUserId={user.id}
          role="passenger"
          otherName={activeRide.driver?.profile?.full_name}
        />
      ) : null}

      <div className="confirm-row confirm-row-price">
        <span>Preço</span><strong>R$ {Number(activeRide.price).toFixed(2)}</strong>
      </div>

      {canCancel ? (
        <Button variant="secondary" fullWidth loading={cancelling} onClick={handleCancel}>
          Cancelar corrida
        </Button>
      ) : null}

      <Modal open={activeRide.status === 'completed'} title="Como foi sua corrida?">
        <p>Conte como foi sua experiência com {activeRide.driver?.profile?.full_name || 'o motociclista'}.</p>
        <Rating value={ratingValue} onChange={setRatingValue} />
        <textarea
          className="field-input"
          rows={3}
          placeholder="Conte como foi sua experiência. Esse texto aparece no perfil do motociclista."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button fullWidth disabled={!ratingValue} loading={submittingRating} onClick={handleSubmitRating}>
          Enviar avaliação
        </Button>
      </Modal>
    </div>
  )
}
