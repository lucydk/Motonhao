import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateDriverProfile } from '../../services/driverService'
import { updateProfile } from '../../services/profileService'
import { useToast } from '../../context/ToastContext'
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
        <div className="profile-avatar" aria-hidden="true">{profile?.full_name?.charAt(0)}</div>
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
    </div>
  )
}
