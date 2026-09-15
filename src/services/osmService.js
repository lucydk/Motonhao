// Serviço de integração com OpenStreetMap.
// - Geolocalização do dispositivo: API nativa do navegador (tentada sempre que o app abre)
// - Última posição conhecida: só um "chute inicial" pra o mapa não abrir zerado
//   caso o GPS ainda não tenha respondido ou falhe — nunca trava o usuário numa cidade fixa
// - Geocodificação (endereço -> coordenadas) e reversa (coordenadas -> endereço): Nominatim
// - Rota entre dois pontos (distância/tempo/traçado): OSRM
//
// Nenhuma chave de API é necessária para nenhum desses serviços.

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving'
const LAST_KNOWN_STORAGE_KEY = 'motonhao_last_known_location'

// Pega a localização atual do dispositivo (GPS/rede), via API do navegador.
// Importante: a maioria dos navegadores só permite isso em HTTPS (ou localhost).
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Seu navegador não suporta geolocalização.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => reject(new Error('Não foi possível acessar sua localização. Verifique a permissão do navegador (e se o site está em HTTPS).')),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  })
}

// Salva a última posição usada (venha do GPS, de um toque no mapa ou de uma busca
// de cidade), só para o mapa abrir num lugar razoável na próxima visita — nunca é
// obrigatório e é sempre substituída se o GPS funcionar.
export function saveLastKnownLocation(point) {
  try {
    localStorage.setItem(
      LAST_KNOWN_STORAGE_KEY,
      JSON.stringify({ lat: point.lat, lon: point.lon, label: point.label || point.displayName })
    )
  } catch {
    // localStorage indisponível: sem problema, só não persiste
  }
}

export function getLastKnownLocation() {
  try {
    const saved = localStorage.getItem(LAST_KNOWN_STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

// Ponto de referência usado para limitar buscas de endereço à região certa.
// Tenta o GPS; se falhar, usa a última posição conhecida (se houver).
export async function getReferenceLocation() {
  try {
    return await getCurrentPosition()
  } catch {
    return getLastKnownLocation()
  }
}

// Converte coordenadas { lat, lon } em um endereço legível.
export async function reverseGeocode(lat, lon) {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), format: 'json' })

  const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
    headers: { 'Accept-Language': 'pt-BR' }
  })
  if (!response.ok) throw new Error('Falha ao identificar o endereço da sua localização.')

  const data = await response.json()
  if (!data?.display_name) throw new Error('Não conseguimos identificar um endereço para essa localização.')

  return data.display_name
}

// Converte um endereço em texto para coordenadas { lat, lon, displayName }.
// Se "near" for informado ({ lat, lon }), a busca fica limitada a uma área de
// ~20km ao redor desse ponto (cidade + arredores) — evita que um nome comum de
// rua seja encontrado em outra cidade/estado e gere uma distância absurda.
// Inclua o número da casa no texto quando possível (ex: "Rua X, 450") para
// deixar a geocodificação mais precisa.
export async function geocodeAddress(address, near) {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    countrycodes: 'br',
    addressdetails: '1'
  })

  if (near) {
    const delta = 0.2 // ~20km ao redor do ponto de referência
    const viewbox = [near.lon - delta, near.lat + delta, near.lon + delta, near.lat - delta].join(',')
    params.set('viewbox', viewbox)
    params.set('bounded', '1')
  }

  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
    headers: { 'Accept-Language': 'pt-BR' }
  })
  if (!response.ok) throw new Error('Falha ao buscar endereço no OpenStreetMap.')

  const results = await response.json()
  if (!results.length) {
    throw new Error(
      near
        ? `Não encontramos "${address}" perto da sua região.`
        : `Endereço não encontrado: "${address}".`
    )
  }

  return {
    lat: Number(results[0].lat),
    lon: Number(results[0].lon),
    displayName: results[0].display_name
  }
}

// Calcula a rota entre dois pontos { lat, lon } usando OSRM.
export async function getRoute(origin, destination) {
  const coords = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`
  const params = new URLSearchParams({ overview: 'full', geometries: 'geojson' })

  const response = await fetch(`${OSRM_URL}/${coords}?${params.toString()}`)
  if (!response.ok) throw new Error('Falha ao calcular a rota.')

  const data = await response.json()
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('Não foi possível calcular a rota entre os pontos informados.')
  }

  const route = data.routes[0]
  return {
    distanceKm: Number((route.distance / 1000).toFixed(2)),
    durationMin: Math.round(route.duration / 60),
    path: route.geometry.coordinates.map(([lon, lat]) => [lat, lon])
  }
}
