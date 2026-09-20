import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Botão "Sair" que aparece no topo de todas as telas internas.
// A pessoa pode sair de onde estiver, sem voltar até a tela inicial.
export default function SignOutButton({ className = '' }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)

  async function handleSignOut() {
    if (leaving) return
    setLeaving(true)
    try {
      await signOut()
    } finally {
      navigate('/', { replace: true })
    }
  }

  return (
    <button type="button" className={`sign-out-btn ${className}`.trim()} onClick={handleSignOut} disabled={leaving}>
      <span aria-hidden="true">⏻</span> {leaving ? 'Saindo…' : 'Sair'}
    </button>
  )
}
