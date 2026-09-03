import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registration && setInterval(() => registration.update(), 60 * 60 * 1000)
    }
  })

  if (!needRefresh) return null

  return (
    <div className="update-banner">
      <span>Nova versão do Motonhão disponível.</span>
      <button className="btn btn-primary btn-sm" onClick={() => updateServiceWorker(true)}>Atualizar agora</button>
    </div>
  )
}
