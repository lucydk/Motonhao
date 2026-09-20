import { supabase } from '../lib/supabase'

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ---------------------------------------------------------------
// Perfil público de outro usuário (nome, foto, moto, nota, corridas).
// Traz só os campos que podem ser vistos por qualquer usuário logado.
// ---------------------------------------------------------------
export async function getPublicProfile(profileId) {
  const { data, error } = await supabase.rpc('public_profile', { target: profileId })

  if (error) throw error
  if (!data) throw new Error('Perfil não encontrado.')
  return data
}
