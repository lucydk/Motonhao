import { supabase } from '../lib/supabase'

export async function signUp({ fullName, email, phone, password, role, driver }) {
  const metadata = {
    full_name: fullName,
    phone,
    role
  }

  if (role === 'driver' && driver) {
    metadata.motorcycle_brand = driver.brand
    metadata.motorcycle_model = driver.model
    metadata.motorcycle_year = driver.year
    metadata.motorcycle_color = driver.color
    metadata.license_plate = driver.plate
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  })

  if (error) throw error
  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`
  })
  if (error) throw error
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session))
  return data.subscription
}
