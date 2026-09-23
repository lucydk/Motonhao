import { supabase } from '../lib/supabase'

// ---------------------------------------------------------------
// Chat da corrida — mensagens curtas entre passageiro e motociclista
// ("já estou a caminho", "cheguei", "pode descer" e por aí vai).
// Só quem está na corrida consegue ler ou escrever (regra no banco, em RLS).
// ---------------------------------------------------------------

export async function getRideMessages(rideId) {
  const { data, error } = await supabase
    .from('ride_messages')
    .select('*, sender:profiles(id, full_name, avatar_url)')
    .eq('ride_id', rideId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function sendRideMessage({ rideId, senderId, body }) {
  const text = body.trim()
  if (!text) return null

  const { data, error } = await supabase
    .from('ride_messages')
    .insert({ ride_id: rideId, sender_id: senderId, body: text.slice(0, 500) })
    .select('*, sender:profiles(id, full_name, avatar_url)')
    .single()

  if (error) throw error
  return data
}

// Recebe em tempo real cada mensagem nova daquela corrida.
export function subscribeToRideMessages(rideId, onMessage) {
  const channel = supabase
    .channel(`ride-chat-${rideId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'ride_messages', filter: `ride_id=eq.${rideId}` },
      (payload) => onMessage(payload.new)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
