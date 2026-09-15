import { supabase } from '../lib/supabase'

// ---------------------------------------------------------------
// Estimativa de preço/tempo a partir de uma distância em km.
// Antes a distância vinha de um hash pseudo-aleatório do texto de
// origem/destino; agora pode vir da rota real calculada pelo OSRM
// (veja src/services/osmService.js), mas a função abaixo continua
// funcionando do mesmo jeito para qualquer distância recebida.
// ---------------------------------------------------------------
function hashText(text) {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  return hash
}

const RIDE_TYPE_CONFIG = {
  economic: { label: 'Motonhão Econômico', multiplier: 0.85, speedKmH: 28 },
  standard: { label: 'Motonhão', multiplier: 1, speedKmH: 34 },
  fast: { label: 'Motonhão Rápido', multiplier: 1.35, speedKmH: 42 }
}

const BASE_FARE = 4.5
const PRICE_PER_KM = 2.35

// Gera as opções de corrida (econômico/padrão/rápido) a partir de uma distância real em km.
export function estimateRideFromDistance(distanceKm) {
  return Object.entries(RIDE_TYPE_CONFIG).map(([type, cfg]) => {
    const price = Number((BASE_FARE + distanceKm * PRICE_PER_KM * cfg.multiplier).toFixed(2))
    const estimatedTime = Math.max(3, Math.round((distanceKm / cfg.speedKmH) * 60))
    return {
      rideType: type,
      label: cfg.label,
      distance: Number(distanceKm.toFixed(2)),
      estimatedTime,
      price
    }
  })
}

// Estimativa simulada (fallback), usada quando o OpenStreetMap não
// consegue geocodificar o endereço digitado pelo usuário.
export function estimateRide(origin, destination) {
  const seed = hashText(`${origin.trim().toLowerCase()}|${destination.trim().toLowerCase()}`)
  const distance = Math.max(1.2, (seed % 1200) / 100) // 1.2km a ~13km
  return estimateRideFromDistance(distance)
}

export async function createRide({
  passengerId,
  origin,
  destination,
  distance,
  estimatedTime,
  price,
  rideType,
  paymentMethod,
  originCoords,
  destinationCoords
}) {
  const { data, error } = await supabase
    .from('rides')
    .insert({
      passenger_id: passengerId,
      origin,
      destination,
      distance,
      estimated_time: estimatedTime,
      price,
      ride_type: rideType,
      payment_method: paymentMethod,
      status: 'searching',
      origin_lat: originCoords?.lat ?? null,
      origin_lng: originCoords?.lon ?? null,
      destination_lat: destinationCoords?.lat ?? null,
      destination_lng: destinationCoords?.lon ?? null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getRideById(rideId) {
  const { data, error } = await supabase
    .from('rides')
    .select('*, driver:drivers(*, profile:profiles(*))')
    .eq('id', rideId)
    .single()

  if (error) throw error
  return data
}

export async function getAvailableRides() {
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .eq('status', 'searching')
    .is('driver_id', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function acceptRide(rideId, driverId) {
  const { data, error } = await supabase
    .from('rides')
    .update({ driver_id: driverId, status: 'accepted' })
    .eq('id', rideId)
    .eq('status', 'searching')
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRideStatus(rideId, status) {
  const { data, error } = await supabase
    .from('rides')
    .update({ status })
    .eq('id', rideId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function cancelRide(rideId) {
  return updateRideStatus(rideId, 'cancelled')
}

export async function getPassengerRideHistory(passengerId) {
  const { data, error } = await supabase
    .from('rides')
    .select('*, driver:drivers(*, profile:profiles(*)), rating:ratings(*)')
    .eq('passenger_id', passengerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getDriverRideHistory(driverId) {
  const { data, error } = await supabase
    .from('rides')
    .select('*, passenger:profiles!rides_passenger_id_fkey(*)')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getDriverActiveRide(driverId) {
  const { data, error } = await supabase
    .from('rides')
    .select('*, passenger:profiles!rides_passenger_id_fkey(*)')
    .eq('driver_id', driverId)
    .in('status', ['accepted', 'driver_arriving', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getPassengerActiveRide(passengerId) {
  const { data, error } = await supabase
    .from('rides')
    .select('*, driver:drivers(*, profile:profiles(*))')
    .eq('passenger_id', passengerId)
    .in('status', ['searching', 'accepted', 'driver_arriving', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

// ---------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------

// Passageiro escuta mudanças em UMA corrida específica.
export function subscribeToRide(rideId, onChange) {
  const channel = supabase
    .channel(`ride-${rideId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` },
      (payload) => onChange(payload.new)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// Motoristas online escutam novas corridas em "searching".
export function subscribeToNewRides(onNewRide) {
  const channel = supabase
    .channel('rides-searching')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'rides', filter: 'status=eq.searching' },
      (payload) => onNewRide(payload.new)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
