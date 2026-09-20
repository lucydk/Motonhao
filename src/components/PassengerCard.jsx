import { Link } from 'react-router-dom'
import Avatar from './Avatar'

// Cartão que o motociclista vê com a foto e o nome de quem vai embarcar.
// Clicando, abre o perfil do passageiro.
export default function PassengerCard({ passenger }) {
  if (!passenger) return null
  const name = passenger.full_name || 'Passageiro'

  const content = (
    <>
      <Avatar src={passenger.avatar_url} name={name} size={64} ring />
      <div className="driver-card-info">
        <strong>{name}</strong>
        <span>Passageiro</span>
        {passenger.id ? <span className="card-link-hint">ver perfil →</span> : null}
      </div>
    </>
  )

  if (!passenger.id) return <div className="driver-card passenger-card">{content}</div>

  return (
    <Link to={`/perfil/${passenger.id}`} className="driver-card passenger-card is-clickable">
      {content}
    </Link>
  )
}
