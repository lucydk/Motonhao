import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateDriverProfile } from '../../services/driverService'
import { updateProfile } from '../../services/profileService'
import { useToast } from '../../context/ToastContext'
import { useAvatarUpload } from '../../hooks/useAvatarUpload'
import { getDriverRatings } from '../../services/ratingService'
import RatingList from '../../components/RatingList'
import AvatarPicker from '../../components/AvatarPicker'
import Card from '../../components/Card'
import Input from '../../components/Input'
import Button from '../../components/Button'

export default function DriverProfile() {
  const { profile, driver, user, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '' })
  const [motoForm, setMotoForm] = useState({
    motorcycle_brand: driver?.motorcycle_brand || '',
    motorcycle_model: driver?.motorcycle_model || '',
    motorcycle_color: driver?.motorcycle_color || '',
    license_plate: driver?.license_plate || ''
  })
  const [loading, setLoading] = useState(false)
  const [ratings, setRatings] = useState([])
  const { upload, uploading } = useAvatarUpload()

  // Avaliações que os passageiros escreveram sobre este motociclista
  useEffect(() => {
    if (!driver?.id) return
    getDriverRatings(driver.id).then(setRatings).catch(() => setRatings([]))
  }, [driver?.id])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(user.id, form)
      if (driver) await updateDriverProfile(driver.id, motoForm)
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

          <fieldset className="fieldset">
            <legend>Dados da moto</legend>
            <div className="field-row">
              <Input label="Marca" value={motoForm.motorcycle_brand} onChange={(e) => setMotoForm({ ...motoForm, motorcycle_brand: e.target.value })} />
              <Input label="Modelo" value={motoForm.motorcycle_model} onChange={(e) => setMotoForm({ ...motoForm, motorcycle_model: e.target.value })} />
            </div>
            <div className="field-row">
              <Input label="Cor" value={motoForm.motorcycle_color} onChange={(e) => setMotoForm({ ...motoForm, motorcycle_color: e.target.value })} />
              <Input label="Placa" value={motoForm.license_plate} onChange={(e) => setMotoForm({ ...motoForm, license_plate: e.target.value })} />
            </div>
          </fieldset>

          <Button type="submit" fullWidth loading={loading}>Salvar alterações</Button>
        </form>
      </Card>

      <Card>
        <h2>Minhas avaliações</h2>
        <p className="page-subtitle">
          ⭐ {Number(driver?.rating ?? 5).toFixed(1)} de média em {driver?.total_rides ?? 0} corridas
        </p>
        <RatingList ratings={ratings} emptyText="Você ainda não recebeu avaliações escritas." />
      </Card>
    </div>
  )
}
