import { useState } from 'react'

export default function Rating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const [hover, setHover] = useState(0)
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className={`rating rating-${size}`} role={readOnly ? undefined : 'radiogroup'} aria-label="Avaliação em estrelas">
      {stars.map((star) => {
        const filled = (hover || value) >= star
        return (
          <button
            type="button"
            key={star}
            className={`rating-star ${filled ? 'is-filled' : ''}`}
            onClick={() => !readOnly && onChange?.(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(0)}
            disabled={readOnly}
            aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}
