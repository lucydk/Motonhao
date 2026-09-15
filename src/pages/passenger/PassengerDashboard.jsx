import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useRide } from '../../context/RideContext'
import { getPassengerActiveRide } from '../../services/rideService'
import {
  getCurrentPosition,
  reverseGeocode,
  geocodeAddress,
  getLastKnownLocation,
  saveLastKnownLocation
} from '../../services/osmService'
import Card from '../../components/Card'
import Input from '../../components/Input'
import Button from '../../components/Button'
import MapReal from '../../components/MapReal'
import Loading from '../../components/Loading'

export default function PassengerDashboard() {
  const { profile, user } = useAuth()
  const { watchRide } = useRide()
  const navigate = useNavigate()

  const [origin, setOrigin] = useState('')
  const [originNumber, setOriginNumber] = useState('')
  const [destination, setDestination] = useState('')
  const [destinationNumber, setDestinationNumber] = useState('')
  const [checking, setChecking] = useState(true)

  // Começa com a última posição conhecida (se houver) só para o mapa não abrir
  // zerado, e tenta o GPS assim que a tela carrega — sem travar numa cidade fixa.
  const [current, setCurrent] = useState(() => getLastKnownLocation())
  const [currentAddress, setCurrentAddress] = useState('')
  const [locating, setLocating] = useState(true)
  const [locationError, setLocationError] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [searchingCity, setSearchingCity] = useState(false)

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

  // Tenta o GPS toda vez que a tela abre (então se você mudou de cidade, atualiza sozinho)
  useEffect(() => {
    setLocating(true)
    getCurrentPosition()
      .then((pos) => {
        setCurrent(pos)
        setLocationError('')
      })
      .catch((err) => setLocationError(err.message))
      .finally(() => setLocating(false))
  }, [])

  // Sempre que o ponto muda (GPS, toque no mapa ou busca de cidade), atualiza o
  // endereço legível e guarda como "última posição conhecida" para a próxima visita
  useEffect(() => {
    if (!current) {
      setCurrentAddress('')
      return
    }
    saveLastKnownLocation(current)

    let cancelled = false
    reverseGeocode(current.lat, current.lon)
      .then((addr) => { if (!cancelled) setCurrentAddress(addr) })
      .catch(() => { if (!cancelled) setCurrentAddress(current.label || '') })
    return () => { cancelled = true }
  }, [current])

  async function handleUseCurrentLocation() {
    setLocating(true)
    setLocationError('')
    try {
      const pos = await getCurrentPosition()
      setCurrent(pos)
    } catch (err) {
      setLocationError(err.message)
    } finally {
      setLocating(false)
    }
  }

  // Busca só o nome de uma cidade/bairro para levar o mapa até lá rapidamente —
  // depois disso, o usuário pode tocar no mapa para marcar o ponto exato.
  async function handleSearchCity(e) {
    e.preventDefault()
    if (!citySearch.trim()) return
    setSearchingCity(true)
    setLocationError('')
    try {
      const point = await geocodeAddress(citySearch)
      setCurrent(point)
    } catch (err) {
      setLocationError(err.message)
    } finally {
      setSearchingCity(false)
    }
  }

  function handleMapPick(point) {
    setCurrent(point)
  }

  function handleSubmit(e) {
    e.preventDefault()
    setLocationError('')

    const typedOrigin = origin.trim()
    const finalOrigin = typedOrigin
      ? (originNumber.trim() ? `${typedOrigin}, ${originNumber.trim()}` : typedOrigin)
      : currentAddress

    const typedDestination = destination.trim()
    const finalDestination = destinationNumber.trim()
      ? `${typedDestination}, ${destinationNumber.trim()}`
      : typedDestination

    if (!finalOrigin || !finalDestination) {
      setLocationError('Informe um destino (a origem pode ficar em branco para usar sua localização atual).')
      return
    }

    navigate('/passenger/escolher-corrida', {
      state: { origin: finalOrigin, destination: finalDestination, near: current }
    })
  }

  if (checking) return <Loading fullScreen label="Verificando corridas em andamento…" />

  return (
    <div className="page passenger-dashboard">
      <h1>Olá, {profile?.full_name?.split(' ')[0]}!</h1>
      <p className="page-subtitle">Para onde vamos hoje?</p>

      <MapReal current={current} onCurrentChange={handleMapPick} zoom={current ? 15 : 4} />

      {locating ? <p className="map-caption">Localizando você…</p> : null}

      {!current && !locating ? (
        <Card className="request-card">
          <p className="page-subtitle">
            Não conseguimos acessar sua localização automaticamente. Toque no mapa acima
            para marcar onde você está, ou busque sua cidade abaixo:
          </p>
          <form onSubmit={handleSearchCity} className="field-with-action">
            <Input
              label="Cidade ou bairro"
              placeholder="Ex: União da Vitória, PR"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
            />
            <button type="submit" className="use-location-btn" disabled={searchingCity}>
              {searchingCity ? 'Buscando…' : 'Buscar'}
            </button>
          </form>
        </Card>
      ) : null}

      {locationError ? <p className="form-error">{locationError}</p> : null}

      <Card className="request-card">
        {current ? (
          <div className="reference-row">
            <span>📍 {currentAddress || 'localização definida no mapa'}</span>
            <button type="button" className="link-btn" onClick={handleUseCurrentLocation} disabled={locating}>
              {locating ? 'atualizando…' : 'usar GPS'}
            </button>
          </div>
        ) : null}

        <h2>Para onde vamos?</h2>
        <form onSubmit={handleSubmit} className="request-form">
          <div className="field-row">
            <Input
              label="Localização atual"
              placeholder={currentAddress || 'Ex: Rua das Flores'}
              hint="Deixe em branco para usar sua localização atual"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
            <Input
              label="Número"
              className="field-number"
              placeholder="Nº"
              value={originNumber}
              onChange={(e) => setOriginNumber(e.target.value)}
            />
          </div>

          <div className="field-row">
            <Input
              label="Destino"
              placeholder="Ex: Av. Central"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
            <Input
              label="Número"
              className="field-number"
              placeholder="Nº"
              value={destinationNumber}
              onChange={(e) => setDestinationNumber(e.target.value)}
            />
          </div>

          <Button type="submit" fullWidth>Encontrar corrida</Button>
        </form>
      </Card>
    </div>
  )
}
