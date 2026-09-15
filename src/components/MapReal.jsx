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
  }, [origin, destination, current, zoom, map])

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

// origin / destination / current: { lat, lon } | undefined
// current = localização atual (pino azul); passe onCurrentChange para deixá-lo
// arrastável e permitir tocar no mapa para reposicioná-lo manualmente
// routePath: array de [lat, lon] retornado por osmService.getRoute (opcional)
export default function MapReal({
  origin,
  destination,
  current,
  onCurrentChange,
  routePath,
  zoom = 16,
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

  return (
    <div className="map-real">
      <MapContainer center={center} zoom={initialZoom} scrollWheelZoom={false} style={{ height: '260px', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {current ? (
          <Marker
            position={[current.lat, current.lon]}
            icon={currentIcon}
            draggable={!!onCurrentChange}
            eventHandlers={
              onCurrentChange
                ? {
                    dragend: (e) => {
                      const pos = e.target.getLatLng()
                      onCurrentChange({ lat: pos.lat, lon: pos.lng })
                    }
                  }
                : undefined
            }
          />
        ) : null}
        {origin ? <Marker position={[origin.lat, origin.lon]} icon={originIcon} /> : null}
        {destination ? <Marker position={[destination.lat, destination.lon]} icon={destinationIcon} /> : null}
        {routePath?.length ? (
          <Polyline positions={routePath} pathOptions={{ color: '#0A0A0A', weight: 4 }} />
        ) : null}
        {onCurrentChange ? <ClickToPick onPick={onCurrentChange} /> : null}
        <FitBounds origin={origin} destination={destination} current={current} zoom={zoom} />
      </MapContainer>
      {onCurrentChange ? <p className="map-hint">Toque no mapa ou arraste o pino para ajustar sua localização.</p> : null}
    </div>
  )
}
