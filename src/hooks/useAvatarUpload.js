import { useCallback, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { uploadAvatar } from '../services/avatarService'

// Envia a foto, atualiza o perfil no contexto e avisa o usuário.
// Devolve true/false pra tela decidir o que fazer em seguida.
export function useAvatarUpload() {
  const { user, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const [uploading, setUploading] = useState(false)

  const upload = useCallback(async (blob, { successMessage = 'Foto atualizada!' } = {}) => {
    if (!user || !blob) return false
    setUploading(true)
    try {
      await uploadAvatar(user.id, blob)
      await refreshProfile()
      if (successMessage) showToast(successMessage, 'success')
      return true
    } catch (err) {
      showToast(err.message || 'Não foi possível enviar a foto.', 'error')
      return false
    } finally {
      setUploading(false)
    }
  }, [user, refreshProfile, showToast])

  return { upload, uploading }
}
