import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useRide } from '../../context/RideContext'
import { setOnlineStatus, getEarnings } from '../../services/driverService'
import { acceptRide, getDriverActiveRide } from '../../services/rideService'
import { useAvailableRides } from '../../hooks/useAvailableRides'
import { useToast } from '../../context/ToastContext'
import RideCard from '../../components/RideCard'
import Card from '../../components/Card'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import Loading from '../../components/Loading'

export default function DriverDashboard() {
  const { driver, profile, refreshProfile } = useAuth()
  const { watchRide } = useRide()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [isOnline, setIsOnline] = useState(driver?.is_online || false)
  const [togglingOnline, setTogglingOnline] = useState(false)
  const [earnings, setEarnings] = useState(null)
  const [checking, setChecking] = useState(true)
  const [acceptingId, setAcceptingId] = useState(null)

  const { rides, loading: ridesLoading, removeRide, refresh } = useAvailableRides(isOnline)

  useEffect(() => {
    if (!driver) return
    setIsOnline(driver.is_online)
    getEarnings(driver.id).then(setEarnings)
  }, [driver])

  useEffect(() => {
    if (!driver) return
    let mounted = true
    getDriverActiveRide(driver.id).then((ride) => {
      if (!mounted) return
      if (ride) {
        watchRide(ride.id)
        navigate('/driver/corrida-ativa', { replace: true })
      } else {
        setChecking(false)
      }
    })
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.id])

  const handleToggleOnline = useCallback(async () => {
    if (!driver) return
    setTogglingOnline(true)
    try {
      const updated = await setOnlineStatus(driver.id, !isOnline)
      setIsOnline(updated.is_online)
      await refreshProfile()
      if (updated.is_online) refresh()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setTogglingOnline(false)
    }
  }, [driver, isOnline, refreshProfile, refresh, showToast])

  async function handleAccept(ride) {
    setAcceptingId(ride.id)
    try {
      const accepted = await acceptRide(ride.id, driver.id)
      removeRide(ride.id)
      await watchRide(accepted.id)
      showToast('Corrida aceita!', 'success')
      navigate('/driver/corrida-ativa')
    } catch (err) {
      showToast('Essa corrida já foi aceita por outro motociclista.', 'error')
      removeRide(ride.id)
    } finally {
      setAcceptingId(null)
    }
  }

  if (checking || !driver) return <Loading fullScreen label="Carregando painel…" />

  return (
    <div className="page">
      <h1>Olá, {profile?.full_name?.split(' ')[0]}!</h1>

      <div className="driver-stats">
        <Card className="stat-card">
          <span>Ganhos hoje</span>
          <strong>R$ {(earnings?.today ?? 0).toFixed(2)}</strong>
        </Card>
        <Card className="stat-card">
          <span>Corridas</span>
          <strong>{driver.total_rides}</strong>
        </Card>
        <Card className="stat-card">
          <span>Avaliação</span>
          <strong>⭐ {Number(driver.rating).toFixed(1)}</strong>
        </Card>
      </div>

      <Button
        fullWidth
        size="lg"
        variant={isOnline ? 'secondary' : 'primary'}
        loading={togglingOnline}
        onClick={handleToggleOnline}
      >
        {isOnline ? 'Ficar offline' : 'Ficar online'}
      </Button>

      {isOnline ? (
        <>
          <p className="online-banner">Você está disponível para corridas</p>
          <h2 className="section-title">Corridas disponíveis</h2>
          {ridesLoading ? (
            <Loading label="Buscando corridas…" />
          ) : rides.length === 0 ? (
            <EmptyState title="Nenhuma corrida no momento" description="Assim que um passageiro pedir uma corrida, ela aparece aqui." />
          ) : (
            <div className="ride-list">
              {rides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  showActions
                  onAccept={handleAccept}
                  onDecline={(r) => removeRide(r.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <EmptyState icon="🌙" title="Você está offline" description="Fique online para começar a receber corridas." />
      )}
    </div>
  )
}
