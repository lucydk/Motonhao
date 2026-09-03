import { supabase } from '../lib/supabase'

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
    const price = Number(ride.price) || 0
    total += price
    if (completedAt && completedAt >= startOfDay) today += price
    if (completedAt && completedAt >= startOfWeek) week += price
    if (completedAt) {
      const key = completedAt.toISOString().slice(0, 10)
      byDay[key] = (byDay[key] || 0) + price
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
