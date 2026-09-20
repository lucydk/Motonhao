import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateProfile } from '../../services/profileService'
import { useToast } from '../../context/ToastContext'
import { useAvatarUpload } from '../../hooks/useAvatarUpload'
import AvatarPicker from '../../components/AvatarPicker'
import Card from '../../components/Card'
import Input from '../../components/Input'
import Button from '../../components/Button'

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '' })
  const [loading, setLoading] = useState(false)
  const { upload, uploading } = useAvatarUpload()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(user.id, form)
      await refreshProfile()
      showToast('Perfil atualizado!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h1>Meu perfil</h1>
      <Card>
        <AvatarPicker
          name={profile?.full_name}
          currentUrl={profile?.avatar_url}
          onChange={(blob) => upload(blob)}
          disabled={uploading}
          size={112}
        />
        <form onSubmit={handleSubmit} className="auth-form">
          <Input label="Nome completo" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Input label="E-mail" value={profile?.email || ''} disabled />
          <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Button type="submit" fullWidth loading={loading}>Salvar alterações</Button>
        </form>
      </Card>
    </div>
  )
}
