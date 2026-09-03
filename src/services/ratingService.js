import { supabase } from '../lib/supabase'

export async function submitRating({ rideId, passengerId, driverId, rating, comment }) {
  const { data, error } = await supabase
    .from('ratings')
    .insert({ ride_id: rideId, passenger_id: passengerId, driver_id: driverId, rating, comment })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getRatingForRide(rideId) {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('ride_id', rideId)
    .maybeSingle()

  if (error) throw error
  return data
}
