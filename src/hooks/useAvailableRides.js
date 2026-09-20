import { useEffect, useState, useCallback } from 'react'
import { getAvailableRides, subscribeToNewRides } from '../services/rideService'

export function useAvailableRides(enabled) {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setRides([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getAvailableRides()
      setRides(data)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Some da lista o que já passou do prazo, mesmo sem recarregar a tela.
  useEffect(() => {
    if (!enabled) return undefined
    const id = setInterval(() => {
      const now = Date.now()
      setRides((prev) => prev.filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now))
    }, 10000)
    return () => clearInterval(id)
  }, [enabled])

  // De minuto em minuto, pede ao banco a lista limpa (e de quebra faz o
  // banco cancelar as corridas vencidas).
  useEffect(() => {
    if (!enabled) return undefined
    const id = setInterval(() => { refresh() }, 60000)
    return () => clearInterval(id)
  }, [enabled, refresh])

  useEffect(() => {
    if (!enabled) return undefined
    const unsubscribe = subscribeToNewRides((newRide) => {
      setRides((prev) => (prev.some((r) => r.id === newRide.id) ? prev : [...prev, newRide]))
    })
    return unsubscribe
  }, [enabled])

  return { rides, loading, refresh, removeRide: (id) => setRides((prev) => prev.filter((r) => r.id !== id)) }
}
