import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getPassengerRideHistory } from '../../services/rideService'
import RideCard from '../../components/RideCard'
import Loading from '../../components/Loading'
import EmptyState from '../../components/EmptyState'

export default function RideHistory() {
  const { user } = useAuth()
  const [rides, setRides] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getPassengerRideHistory(user.id).then(setRides).catch((err) => setError(err.message))
  }, [user.id])

  if (error) return <p className="form-error">{error}</p>
  if (!rides) return <Loading fullScreen label="Carregando histórico…" />

  return (
    <div className="page">
      <h1>Minhas corridas</h1>
      {rides.length === 0 ? (
        <EmptyState title="Nenhuma corrida ainda" description="Suas próximas corridas aparecerão aqui." />
      ) : (
        <div className="ride-list">
          {rides.map((ride) => <RideCard key={ride.id} ride={ride} />)}
        </div>
      )}
    </div>
  )
}
