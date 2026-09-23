import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPublicProfile } from '../services/profileService'
import { getDriverRatings } from '../services/ratingService'
import Avatar from '../components/Avatar'
import Plate from '../components/Plate'
import Card from '../components/Card'
import Rating from '../components/Rating'
import RatingList from '../components/RatingList'
import Loading from '../components/Loading'

function memberSince(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

// Perfil de OUTRA pessoa (motociclista ou passageiro): foto, dados da moto,
// nota média e, principalmente, as avaliações escritas que ela recebeu.
export default function PublicProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setProfile(null)
    setError('')

    getPublicProfile(id)
      .then(async (data) => {
        if (cancelled) return
        setProfile(data)
        if (data.driver?.id) {
          const list = await getDriverRatings(data.driver.id)
          if (!cancelled) setRatings(list)
        } else {
          setRatings([])
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message) })

    return () => { cancelled = true }
  }, [id])

  if (error) {
    return (
      <div className="page">
        <button type="button" className="page-back" onClick={() => navigate(-1)}>← Voltar</button>
        <p className="form-error">{error}</p>
      </div>
    )
  }

  if (!profile) return <Loading fullScreen label="Carregando perfil…" />

  const driver = profile.driver
  const since = memberSince(profile.created_at)

  return (
    <div className="page">
      <button type="button" className="page-back" onClick={() => navigate(-1)}>← Voltar</button>

      <Card className="public-profile-header">
        <Avatar src={profile.avatar_url} name={profile.full_name} size={92} ring />
        <div className="public-profile-info">
          <h1>{profile.full_name}</h1>
          <span className="public-profile-role">
            {driver ? '🏍️ Motociclista' : '👤 Passageiro'}
            {since ? ` · no Motonhão desde ${since}` : ''}
          </span>

          {driver ? (
            <div className="public-profile-stats">
              <span>⭐ {Number(driver.rating).toFixed(1)}</span>
              <span>{driver.total_rides} corridas</span>
              <span>{ratings.length} avaliações</span>
            </div>
          ) : (
            <div className="public-profile-stats">
              <span>{profile.completed_rides} corridas concluídas</span>
            </div>
          )}
        </div>
      </Card>

      {driver ? (
        <Card>
          <h2>A moto</h2>
          <div className="confirm-row"><span>Modelo</span><strong>{driver.motorcycle_brand} {driver.motorcycle_model}</strong></div>
          <div className="confirm-row"><span>Cor</span><strong>{driver.motorcycle_color || '—'}</strong></div>
          <div className="public-profile-plate"><Plate value={driver.license_plate} /></div>
        </Card>
      ) : null}

      {driver ? (
        <Card>
          <h2>Avaliações</h2>
          <div className="public-profile-average">
            <strong>{Number(driver.rating).toFixed(1)}</strong>
            <Rating value={Math.round(Number(driver.rating))} readOnly size="sm" />
          </div>
          <RatingList
            ratings={ratings}
            emptyText="Este motociclista ainda não recebeu avaliações escritas."
          />
        </Card>
      ) : null}
    </div>
  )
}
