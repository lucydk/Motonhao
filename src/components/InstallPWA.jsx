import { useEffect, useState } from 'react'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    setIsStandalone(standalone)

    function handleBeforeInstall(e) {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  if (isStandalone || !deferredPrompt || dismissed) return null

  async function handleInstall() {
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return (
    <div className="install-banner">
      <span>Instale o Motonhão no seu aparelho para uma experiência completa.</span>
      <div className="install-banner-actions">
        <button className="btn btn-primary btn-sm" onClick={handleInstall}>Instalar Motonhão</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setDismissed(true)}>Agora não</button>
      </div>
    </div>
  )
}
