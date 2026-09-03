import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRide } from '../../context/RideContext'
import { useAuth } from '../../context/AuthContext'
import { cancelRide } from '../../services/rideService'
import { submitRating } from '../../services/ratingService'
import { useToast } from '../../context/ToastContext'
import MapMock from '../../components/MapMock'
import RideStatus from '../../components/RideStatus'
import DriverCard from '../../components/DriverCard'
import Rating from '../../components/Rating'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import Loading from '../../components/Loading'

export default function ActiveRide() {
  const { activeRide, clearRide } = useRide()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [cancelling, setCancelling] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)
  const [comment, setComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)

  useEffect(() => {
    if (!activeRide) {
      const t = setTimeout(() => navigate('/passenger', { replace: true }), 300)
      return () => clearTimeout(t)
    }
  }, [activeRide, navigate])

  if (!activeRide) return <Loading fullScreen label="Carregando corrida…" />

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

      <MapMock origin={activeRide.origin} destination={activeRide.destination} status={activeRide.status} />

      <RideStatus status={activeRide.status} />

      {activeRide.driver ? (
        <>
          {activeRide.status === 'accepted' ? <p className="found-banner">Motociclista encontrado!</p> : null}
          <DriverCard driver={activeRide.driver} />
        </>
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
          placeholder="Conte como foi sua experiência."
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
