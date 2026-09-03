import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null

  return (
    <div className="offline-banner" role="status">
      Você está offline. Algumas funções do Motonhão não estão disponíveis.
    </div>
  )
}
