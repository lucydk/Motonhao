import { supabase } from '../lib/supabase'
import { getDriverShare } from '../config/platformConfig'

export async function getDriverByProfileId(profileId) {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function setOnlineStatus(driverId, isOnline) {
  const { data, error } = await supabase
    .from('drivers')
    .update({ is_online: isOnline })
    .eq('id', driverId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDriverProfile(driverId, updates) {
  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', driverId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ---------------------------------------------------------------
// Verificação de cadastro (aprovação pelo administrador)
// ---------------------------------------------------------------

export async function approveDriver(driverId) {
  const { data, error } = await supabase
    .from('drivers')
    .update({ verification_status: 'approved', verification_note: null })
    .eq('id', driverId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function rejectDriver(driverId, note) {
  const { data, error } = await supabase
    .from('drivers')
    .update({ verification_status: 'rejected', verification_note: note || null })
    .eq('id', driverId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ---------------------------------------------------------------
// Ganhos do motorista — sempre a parte dele (75%), nunca o valor
// total da corrida que o passageiro pagou.
// ---------------------------------------------------------------

export async function getEarnings(driverId) {
  const { data, error } = await supabase
    .from('rides')
    .select('price, completed_at, status')
    .eq('driver_id', driverId)
    .eq('status', 'completed')

  if (error) throw error

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())

  let today = 0
  let week = 0
  let total = 0
  const byDay = {}

  data.forEach((ride) => {
    const completedAt = ride.completed_at ? new Date(ride.completed_at) : null
    const driverShare = getDriverShare(ride.price)
    total += driverShare
    if (completedAt && completedAt >= startOfDay) today += driverShare
    if (completedAt && completedAt >= startOfWeek) week += driverShare
    if (completedAt) {
      const key = completedAt.toISOString().slice(0, 10)
      byDay[key] = (byDay[key] || 0) + driverShare
    }
  })

  return {
    today,
    week,
    total,
    ridesCount: data.length,
    average: data.length ? total / data.length : 0,
    byDay
  }
}
