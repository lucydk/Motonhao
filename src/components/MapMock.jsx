export default function MapMock({ origin, destination, status }) {
  return (
    <div className="map-mock" role="img" aria-label="Mapa simulado da rota">
      <svg viewBox="0 0 400 220" className="map-mock-svg">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--color-border)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="220" fill="var(--color-surface-2)" />
        <rect width="400" height="220" fill="url(#grid)" />
        <path d="M40,170 C 120,60 220,190 360,50" fill="none" stroke="var(--color-yellow)" strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round" />
        <circle cx="40" cy="170" r="8" fill="var(--color-black)" stroke="var(--color-yellow)" strokeWidth="3" />
        <circle cx="360" cy="50" r="8" fill="var(--color-yellow)" stroke="var(--color-black)" strokeWidth="3" />
        {status && status !== 'searching' ? (
          <circle cx="190" cy="120" r="7" fill="var(--color-black)">
            <animate attributeName="r" values="7;10;7" dur="1.6s" repeatCount="indefinite" />
          </circle>
        ) : null}
      </svg>
      <div className="map-mock-labels">
        <span className="map-mock-origin">📍 {origin || 'Sua localização'}</span>
        <span className="map-mock-destination">🏁 {destination || 'Destino'}</span>
      </div>
    </div>
  )
}
