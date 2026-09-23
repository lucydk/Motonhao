import { useEffect, useState } from 'react'
import { geocodeAddress, getRoute } from '../services/osmService'

// Prepara o mapa REAL da corrida em andamento:
//  1. usa as coordenadas gravadas na corrida (caminho normal);
//  2. se a corrida for antiga e não tiver coordenadas, geocodifica os
//     endereços em texto na hora — assim nunca cai num mapa genérico;
//  3. pede ao OSRM o traçado da rota, pra desenhar a linha no mapa.
export function useRideRoute(ride) {
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [routePath, setRoutePath] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const originLat = ride?.origin_lat
  const originLng = ride?.origin_lng
  const destinationLat = ride?.destination_lat
  const destinationLng = ride?.destination_lng
  const originText = ride?.origin
  const destinationText = ride?.destination

  useEffect(() => {
    if (!ride) return undefined
    let cancelled = false
    setLoading(true)
    setError('')

    async function resolve() {
      try {
        let originPoint =
          originLat != null && originLng != null ? { lat: originLat, lon: originLng } : null
        let destinationPoint =
          destinationLat != null && destinationLng != null
            ? { lat: destinationLat, lon: destinationLng }
            : null

        // Corridas criadas antes das coordenadas existirem: acha no endereço.
        if (!originPoint && originText) originPoint = await geocodeAddress(originText)
        if (!destinationPoint && destinationText) destinationPoint = await geocodeAddress(destinationText)
        if (cancelled) return

        setOrigin(originPoint)
        setDestination(destinationPoint)

        if (originPoint && destinationPoint) {
          const route = await getRoute(originPoint, destinationPoint)
          if (!cancelled) setRoutePath(route.path)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    resolve()
    return () => { cancelled = true }
    // Só recalcula quando os PONTOS mudam — não a cada atualização em tempo
    // real da corrida (posição do motociclista, mudança de status etc).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originLat, originLng, destinationLat, destinationLng, originText, destinationText])

  return { origin, destination, routePath, loading, error }
}
