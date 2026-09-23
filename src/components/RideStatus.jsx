const STEPS = [
  { key: 'searching', label: 'Procurando motociclista' },
  { key: 'accepted', label: 'Motociclista encontrado' },
  { key: 'driver_arriving', label: 'Motociclista a caminho' },
  { key: 'in_progress', label: 'Em viagem' },
  { key: 'completed', label: 'Corrida finalizada' }
]

export default function RideStatus({ status }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status)

  if (status === 'cancelled') {
    return (
      <div className="ride-status ride-status-cancelled">
        <span className="ride-status-dot" /> Corrida cancelada
      </div>
    )
  }

  return (
    <ol className="ride-status">
      {STEPS.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending'
        return (
          <li key={step.key} className={`ride-status-step is-${state}`}>
            <span className="ride-status-dot" />
            <span className="ride-status-label">{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
