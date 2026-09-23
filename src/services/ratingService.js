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

// ---------------------------------------------------------------
// Avaliações recebidas por um motociclista, com o texto que o
// passageiro escreveu e quem escreveu. Usado no perfil público e na
// tela "minhas avaliações" do próprio motociclista.
// ---------------------------------------------------------------
export async function getDriverRatings(driverId) {
  const { data, error } = await supabase.rpc('driver_ratings', { target_driver: driverId })

  if (error) throw error
  return data || []
}
