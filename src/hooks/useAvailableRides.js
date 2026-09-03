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

  useEffect(() => {
    if (!enabled) return undefined
    const unsubscribe = subscribeToNewRides((newRide) => {
      setRides((prev) => (prev.some((r) => r.id === newRide.id) ? prev : [...prev, newRide]))
    })
    return unsubscribe
  }, [enabled])

  return { rides, loading, refresh, removeRide: (id) => setRides((prev) => prev.filter((r) => r.id !== id)) }
}
