import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registration && setInterval(() => registration.update(), 60 * 60 * 1000)
    }
  })

  if (!needRefresh) return null

  async function handleUpdate() {
    // "false" ativa a nova versão em segundo plano SEM recarregar a página agora.
    // Isso evita o loop de recarregar e pedir instalação de novo — a versão nova
    // passa a valer sozinha na próxima vez que o app for aberto/atualizado.
    await updateServiceWorker(false)
    setNeedRefresh(false)
  }

  return (
    <div className="update-banner">
      <span>Nova versão do Motonhão disponível.</span>
      <button className="btn btn-primary btn-sm" onClick={handleUpdate}>Atualizar agora</button>
    </div>
  )
}
