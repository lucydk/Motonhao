export default function Loading({ label = 'Carregando…', fullScreen }) {
  return (
    <div className={fullScreen ? 'loading-fullscreen' : 'loading-inline'}>
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
