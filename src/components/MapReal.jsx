import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const originIcon = L.divIcon({
  className: 'map-marker map-marker-origin',
  html: '📍',
  iconSize: [28, 28],
  iconAnchor: [14, 26]
})

const destinationIcon = L.divIcon({
  className: 'map-marker map-marker-destination',
  html: '🏁',
  iconSize: [28, 28],
  iconAnchor: [14, 26]
})

// Moto do motociclista andando no mapa durante a corrida
const vehicleIcon = L.divIcon({
  className: 'map-marker map-marker-vehicle',
  html: '🏍️',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
})

const currentIcon = L.divIcon({
  className: 'map-marker map-marker-current',
  html: '<span class="map-marker-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
})

// Ajusta o zoom/enquadramento do mapa e corrige o mapa aparecendo cinza/cortado
// quando o container do Leaflet é medido antes de ter o tamanho final na tela.
function FitBounds({ origin, destination, current, zoom }) {
  const map = useMap()

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150)
    return () => clearTimeout(t)
  }, [map])

  useEffect(() => {
    if (origin && destination) {
      map.fitBounds([[origin.lat, origin.lon], [destination.lat, destination.lon]], { padding: [40, 40] })
    } else if (origin) {
      map.setView([origin.lat, origin.lon], zoom)
    } else if (destination) {
      map.setView([destination.lat, destination.lon], zoom)
    } else if (current) {
      map.setView([current.lat, current.lon], zoom)
    }
    // Só reenquadra quando os PONTOS mudam de verdade (não a cada pixel de
    // arraste) — o próprio Leaflet mantém o pino visível durante o drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lon, destination?.lat, destination?.lon, current?.lat, current?.lon, zoom, map])

  return null
}

// Permite tocar/clicar em qualquer ponto do mapa para mover o pino de "localização atual"
function ClickToPick({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lon: e.latlng.lng })
    }
  })
  return null
}

function DraggableMarker({ position, icon, onChange }) {
  return (
    <Marker
      position={position}
      icon={icon}
      draggable={!!onChange}
      eventHandlers={
        onChange
          ? {
              dragend: (e) => {
                const pos = e.target.getLatLng()
                onChange({ lat: pos.lat, lon: pos.lng })
              }
            }
          : undefined
      }
    />
  )
}

// origin / destination / current: { lat, lon } | undefined
// current = localização atual (pino azul); passe onCurrentChange para deixá-lo
// arrastável e permitir tocar no mapa para reposicioná-lo manualmente.
// onOriginChange / onDestinationChange: se passados, deixam os respectivos
// pinos arrastáveis (usado na tela "Escolha sua corrida" para corrigir um
// endereço que o OpenStreetMap posicionou no meio da rua, e não na casa certa).
// routePath: array de [lat, lon] retornado por osmService.getRoute (opcional)
// vehicle: { lat, lon } — posição ao vivo da moto durante a corrida
// height: altura do mapa (na corrida em andamento ele fica maior)
export default function MapReal({
  origin,
  destination,
  current,
  vehicle,
  onCurrentChange,
  onOriginChange,
  onDestinationChange,
  routePath,
  zoom = 16,
  height = 260,
  defaultCenter = [-14.235, -51.9253] // centro do Brasil, só usado se nada mais estiver disponível
}) {
  const center = current
    ? [current.lat, current.lon]
    : origin
      ? [origin.lat, origin.lon]
      : destination
        ? [destination.lat, destination.lon]
        : defaultCenter

  const initialZoom = current || origin || destination ? zoom : 4
  const editableHint = onOriginChange || onDestinationChange
    ? 'Se o pino não caiu no lugar certo, arraste-o até o endereço correto.'
    : onCurrentChange
      ? 'Toque no mapa ou arraste o pino para ajustar sua localização.'
      : null

  return (
    <div className="map-real">
      <MapContainer center={center} zoom={initialZoom} scrollWheelZoom={false} style={{ height: `${height}px`, width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {current ? (
          <DraggableMarker position={[current.lat, current.lon]} icon={currentIcon} onChange={onCurrentChange} />
        ) : null}
        {origin ? (
          <DraggableMarker position={[origin.lat, origin.lon]} icon={originIcon} onChange={onOriginChange} />
        ) : null}
        {destination ? (
          <DraggableMarker position={[destination.lat, destination.lon]} icon={destinationIcon} onChange={onDestinationChange} />
        ) : null}
        {vehicle ? <Marker position={[vehicle.lat, vehicle.lon]} icon={vehicleIcon} /> : null}
        {routePath?.length ? (
          <Polyline positions={routePath} pathOptions={{ color: '#ff6a00', weight: 5, opacity: 0.9 }} />
        ) : null}
        {onCurrentChange ? <ClickToPick onPick={onCurrentChange} /> : null}
        <FitBounds origin={origin} destination={destination} current={current} zoom={zoom} />
      </MapContainer>
      {editableHint ? <p className="map-hint">{editableHint}</p> : null}
    </div>
  )
}
