import { supabase } from '../lib/supabase'

// Remove espaços/hífen e deixa maiúsculo, pra "abc-1234", "ABC1234" e
// "abc 1234" serem tratados como a mesma placa na hora de comparar.
function normalizePlate(plate) {
  return plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

export async function signUp({ fullName, email, phone, password, role, driver }) {
  const metadata = {
    full_name: fullName,
    phone,
    role
  }

  if (role === 'driver' && driver) {
    const normalizedPlate = normalizePlate(driver.plate)

    // Verifica se a placa já está cadastrada antes de criar a conta. Se a
    // checagem falhar por algum motivo (ex: permissão), não trava o cadastro
    // — a trava de segurança (unique constraint) no banco cobre esse caso.
    try {
      const { data: existing } = await supabase
        .from('drivers')
        .select('id')
        .eq('license_plate', normalizedPlate)
        .maybeSingle()

      if (existing) {
        throw new Error('Essa placa já está cadastrada em outra conta.')
      }
    } catch (err) {
      if (err.message === 'Essa placa já está cadastrada em outra conta.') throw err
      // outro tipo de erro na checagem (ex: rede/permissão): segue o cadastro
      // normalmente, confiando na trava do banco como segurança final
    }

    metadata.motorcycle_brand = driver.brand
    metadata.motorcycle_model = driver.model
    metadata.motorcycle_year = driver.year
    metadata.motorcycle_color = driver.color
    metadata.license_plate = normalizedPlate
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  })

  if (error) {
    const msg = error.message?.toLowerCase() || ''
    if (msg.includes('license_plate') || msg.includes('drivers_license_plate')) {
      throw new Error('Essa placa já está cadastrada em outra conta.')
    }
    throw error
  }
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
