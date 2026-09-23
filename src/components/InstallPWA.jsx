import { useEffect, useState } from 'react'

const DISMISS_KEY = 'motonhao_install_dismissed'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

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

  function handleDismiss() {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // sem problema, só não persiste
    }
  }

  return (
    <div className="install-banner">
      <span>Instale o Motonhão no seu aparelho para uma experiência completa.</span>
      <div className="install-banner-actions">
        <button className="btn btn-primary btn-sm" onClick={handleInstall}>Instalar Motonhão</button>
        <button className="btn btn-ghost btn-sm" onClick={handleDismiss}>Agora não</button>
      </div>
    </div>
  )
}
