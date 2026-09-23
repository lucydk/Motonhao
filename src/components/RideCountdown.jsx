import { useEffect, useState } from 'react'
import { RIDE_SEARCH_TIMEOUT_MINUTES } from '../config/platformConfig'

// Mostra quanto tempo falta até o pedido se cancelar sozinho.
// Quando chega a zero, avisa a tela (onExpire) uma única vez.
export default function RideCountdown({ expiresAt, onExpire }) {
  const [remaining, setRemaining] = useState(() => remainingMs(expiresAt))

  useEffect(() => {
    setRemaining(remainingMs(expiresAt))
    const id = setInterval(() => setRemaining(remainingMs(expiresAt)), 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  useEffect(() => {
    if (remaining === 0) onExpire?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining === 0])

  if (remaining === null) return null

  const totalSeconds = Math.floor(remaining / 1000)
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  const almostOver = totalSeconds <= 60

  return (
    <div className={`ride-countdown ${almostOver ? 'is-ending' : ''}`}>
      <strong>{minutes}:{seconds}</strong>
      <span>
        {totalSeconds === 0
          ? 'Tempo esgotado — cancelando o pedido…'
          : `Se ninguém aceitar em até ${RIDE_SEARCH_TIMEOUT_MINUTES} min, o pedido é cancelado automaticamente.`}
      </span>
    </div>
  )
}

function remainingMs(expiresAt) {
  if (!expiresAt) return null
  return Math.max(0, new Date(expiresAt).getTime() - Date.now())
}
