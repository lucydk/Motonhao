import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile } from '../services/profileService'
import { getDriverByProfileId } from '../services/driverService'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfileData = useCallback(async (userId) => {
    try {
      const profileData = await getProfile(userId)
      setProfile(profileData)

      if (profileData.role === 'driver') {
        const driverData = await getDriverByProfileId(userId)
        setDriver(driverData)
      } else {
        setDriver(null)
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
      setProfile(null)
      setDriver(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) {
        loadProfileData(data.session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        loadProfileData(newSession.user.id)
      } else {
        setProfile(null)
        setDriver(null)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfileData])

  const refreshProfile = useCallback(() => {
    if (session?.user) return loadProfileData(session.user.id)
    return Promise.resolve()
  }, [session, loadProfileData])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setProfile(null)
    setDriver(null)
    setSession(null)
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    driver,
    role: profile?.role ?? null,
    loading,
    isAuthenticated: !!session,
    refreshProfile,
    signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
