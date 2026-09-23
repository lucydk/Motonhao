import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAvatarUpload } from '../../hooks/useAvatarUpload'
import { homeRouteFor } from '../../config/routes'
import AvatarPicker from '../../components/AvatarPicker'
import Button from '../../components/Button'
import SignOutButton from '../../components/SignOutButton'

// Passo obrigatório logo depois do login: quem ainda não tem foto cai aqui.
// Assim o passageiro reconhece o motociclista (e vice-versa) no embarque.
export default function ProfilePhoto() {
  const { profile, role } = useAuth()
  const location = useLocation()
  const { upload, uploading } = useAvatarUpload()
  const [blob, setBlob] = useState(null)

  // Depois que a foto é salva, o perfil no contexto ganha avatar_url e a
  // pessoa segue sozinha para onde estava indo.
  if (profile?.avatar_url) {
    return <Navigate to={location.state?.from || homeRouteFor(role)} replace />
  }

  const isDriver = role === 'driver'

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="page-header-top">
          <span />
          <SignOutButton />
        </div>

        <h1>Sua foto</h1>
        <p className="auth-subtitle">
          {isDriver
            ? 'O passageiro vê sua foto quando você aceita a corrida, pra saber que é você que está chegando.'
            : 'O motociclista vê sua foto pra te reconhecer no ponto de embarque.'}
        </p>

        <AvatarPicker
          name={profile?.full_name}
          onChange={setBlob}
          disabled={uploading}
        />

        <ul className="photo-tips">
          <li>Rosto visível e bem iluminado</li>
          <li>Sem óculos escuros, boné ou capacete</li>
          <li>Só você na foto</li>
        </ul>

        <Button
          fullWidth
          disabled={!blob}
          loading={uploading}
          onClick={() => upload(blob, { successMessage: 'Foto salva! Tudo pronto.' })}
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
