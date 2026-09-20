import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { subscribeToRide, getRideById } from '../services/rideService'

const RideContext = createContext(null)

export function RideProvider({ children }) {
  const [activeRide, setActiveRide] = useState(null)
  const unsubscribeRef = useRef(null)

  const watchRide = useCallback(async (rideId) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    if (!rideId) {
      setActiveRide(null)
      return
    }

    const full = await getRideById(rideId)
    setActiveRide(full)

    unsubscribeRef.current = subscribeToRide(rideId, async () => {
      const updated = await getRideById(rideId)
      setActiveRide(updated)
    })
  }, [])

  const clearRide = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    setActiveRide(null)
  }, [])

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current()
    }
  }, [])

  return (
    <RideContext.Provider value={{ activeRide, watchRide, clearRide, setActiveRide }}>
      {children}
    </RideContext.Provider>
  )
}

export function useRide() {
  const ctx = useContext(RideContext)
  if (!ctx) throw new Error('useRide deve ser usado dentro de <RideProvider>')
  return ctx
}
