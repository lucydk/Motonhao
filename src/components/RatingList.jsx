import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import Rating from './Rating'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Avaliações com o texto que a pessoa escreveu — não só a média de estrelas.
export default function RatingList({ ratings = [], emptyText = 'Ainda não há avaliações escritas.' }) {
  if (!ratings.length) return <p className="page-subtitle">{emptyText}</p>

  return (
    <ul className="rating-list">
      {ratings.map((r) => (
        <li key={r.id} className="rating-item">
          <div className="rating-item-top">
            <Link to={`/perfil/${r.passenger_id}`} className="rating-item-author">
              <Avatar src={r.passenger_avatar} name={r.passenger_name || ''} size={34} />
              <strong>{r.passenger_name || 'Passageiro'}</strong>
            </Link>
            <time className="rating-item-date">{formatDate(r.created_at)}</time>
          </div>

          <Rating value={r.rating} readOnly size="sm" />

          {r.comment?.trim() ? (
            <p className="rating-item-comment">{r.comment}</p>
          ) : (
            <p className="rating-item-comment is-empty">Sem comentário escrito.</p>
          )}
        </li>
      ))}
    </ul>
  )
}
