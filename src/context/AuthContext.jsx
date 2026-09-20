import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
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

  // Id do usuário cujo perfil já foi (ou está sendo) carregado. Evita recarregar
  // a cada renovação de token e deixa o "loading" valer também logo após o login.
  const loadedUserId = useRef(null)

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

  // Sincroniza o perfil com o usuário da sessão. Enquanto o perfil carrega,
  // loading fica true — assim as rotas só decidem pra onde mandar a pessoa
  // (painel certo, tela de foto) quando já sabem quem ela é.
  const syncUser = useCallback(async (user) => {
    if (!user) {
      loadedUserId.current = null
      setProfile(null)
      setDriver(null)
      setLoading(false)
      return
    }
    if (loadedUserId.current === user.id) return

    loadedUserId.current = user.id
    setLoading(true)
    await loadProfileData(user.id)
    setLoading(false)
  }, [loadProfileData])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      syncUser(data.session?.user ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      syncUser(newSession?.user ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [syncUser])

  const refreshProfile = useCallback(() => {
    if (session?.user) return loadProfileData(session.user.id)
    return Promise.resolve()
  }, [session, loadProfileData])

  const signOut = useCallback(async () => {
    await authService.signOut()
    loadedUserId.current = null
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
