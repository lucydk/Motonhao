import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useRide } from '../../context/RideContext'
import { getPassengerActiveRide } from '../../services/rideService'
import Card from '../../components/Card'
import Input from '../../components/Input'
import Button from '../../components/Button'
import MapMock from '../../components/MapMock'
import Loading from '../../components/Loading'

export default function PassengerDashboard() {
  const { profile, user } = useAuth()
  const { watchRide } = useRide()
  const navigate = useNavigate()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true
    getPassengerActiveRide(user.id).then((ride) => {
      if (!mounted) return
      if (ride) {
        watchRide(ride.id)
        navigate('/passenger/corrida-ativa', { replace: true })
      } else {
        setChecking(false)
      }
    })
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  function handleSubmit(e) {
    e.preventDefault()
    if (!origin.trim() || !destination.trim()) return
    navigate('/passenger/escolher-corrida', { state: { origin, destination } })
  }

  if (checking) return <Loading fullScreen label="Verificando corridas em andamento…" />

  return (
    <div className="page passenger-dashboard">
      <h1>Olá, {profile?.full_name?.split(' ')[0]}!</h1>
      <p className="page-subtitle">Para onde vamos hoje?</p>

      <MapMock origin={origin} destination={destination} />

      <Card className="request-card">
        <h2>Para onde vamos?</h2>
        <form onSubmit={handleSubmit} className="request-form">
          <Input
            label="Localização atual"
            placeholder="Ex: Rua das Flores, 123"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            required
          />
          <Input
            label="Destino"
            placeholder="Ex: Av. Central, 456"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />
          <Button type="submit" fullWidth>Encontrar corrida</Button>
        </form>
      </Card>
    </div>
  )
}
