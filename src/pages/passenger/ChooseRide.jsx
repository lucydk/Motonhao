import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { estimateRide, estimateRideFromDistance } from '../../services/rideService'
import { geocodeAddress, getRoute, getReferenceLocation } from '../../services/osmService'
import MapReal from '../../components/MapReal'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Loading from '../../components/Loading'

export default function ChooseRide() {
  const location = useLocation()
  const navigate = useNavigate()
  const { origin, destination, near: nearFromDashboard } = location.state || {}
  const [selected, setSelected] = useState(null)
  const [options, setOptions] = useState([])
  const [coords, setCoords] = useState({ origin: null, destination: null })
  const [routePath, setRoutePath] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!origin || !destination) return
    let cancelled = false
    setLoading(true)
    setError('')

    async function loadRoute() {
      try {
        // Usa o ponto que o usuário já confirmou no dashboard (GPS ou marcado no
        // mapa); só refaz a busca se, por algum motivo, ele não tiver vindo.
        const near = nearFromDashboard || (await getReferenceLocation())

        const [originPoint, destinationPoint] = await Promise.all([
          geocodeAddress(origin, near),
          geocodeAddress(destination, near)
        ])
        if (cancelled) return

        const route = await getRoute(originPoint, destinationPoint)
        if (cancelled) return

        setCoords({ origin: originPoint, destination: destinationPoint })
        setRoutePath(route.path)
        setOptions(estimateRideFromDistance(route.distanceKm))
      } catch (err) {
        if (cancelled) return
        setError(`${err.message} Mostrando uma estimativa aproximada.`)
        setOptions(estimateRide(origin, destination))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadRoute()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination])

  if (!origin || !destination) return <Navigate to="/passenger" replace />

  function handleContinue() {
    if (!selected) return
    navigate('/passenger/confirmar', {
      state: {
        origin,
        destination,
        option: selected,
        originCoords: coords.origin,
        destinationCoords: coords.destination
      }
    })
  }

  return (
    <div className="page">
      <h1>Escolha sua corrida</h1>
      <p className="page-subtitle">{origin} → {destination}</p>

      <MapReal origin={coords.origin} destination={coords.destination} routePath={routePath} zoom={15} />

      {coords.origin && coords.destination ? (
        <p className="map-caption">
          {coords.origin.displayName} → {coords.destination.displayName}
        </p>
      ) : null}

      {loading ? (
        <Loading label="Calculando a melhor rota…" />
      ) : (
        <>
          {error ? <p className="form-error">{error}</p> : null}

          <div className="ride-options">
            {options.map((opt) => (
              <Card
                key={opt.rideType}
                className={`ride-option ${selected?.rideType === opt.rideType ? 'is-selected' : ''}`}
                as="button"
                onClick={() => setSelected(opt)}
              >
                <div className="ride-option-icon" aria-hidden="true">
                  {opt.rideType === 'economic' ? '🛵' : '🏍️'}
                </div>
                <div className="ride-option-info">
                  <strong>{opt.label}</strong>
                  <span>{opt.distance} km · {opt.estimatedTime} min</span>
                </div>
                <div className="ride-option-price">R$ {opt.price.toFixed(2)}</div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Button fullWidth disabled={!selected} onClick={handleContinue}>Continuar</Button>
    </div>
  )
}
