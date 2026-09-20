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
    <button
      type="button"
      className={`sign-out-btn ${className}`.trim()}
      onClick={handleSignOut}
      disabled={leaving}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 3V12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M7.05 5.55C5.17 6.93 4 9.17 4 11.67C4 16.08 7.58 19.67 12 19.67C16.42 19.67 20 16.08 20 11.67C20 9.17 18.83 6.93 16.95 5.55"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {leaving ? 'Saindo…' : 'Sair'}
    </button>
  )
}