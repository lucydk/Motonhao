import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { signUp } from '../../services/authService'
import { useToast } from '../../context/ToastContext'

export default function Register() {
  const [role, setRole] = useState('passenger')
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    brand: '', model: '', year: '', color: '', plate: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (role === 'driver' && (!form.brand || !form.model || !form.plate)) {
      setError('Preencha os dados da sua moto para continuar.')
      return
    }

    setLoading(true)
    try {
      await signUp({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
        driver: role === 'driver' ? {
          brand: form.brand, model: form.model, year: form.year, color: form.color, plate: form.plate
        } : undefined
      })
      showToast('Conta criada! Verifique seu e-mail se a confirmação estiver ativa.', 'success')
      navigate('/entrar')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1>Criar conta no Motonhão</h1>
        <p className="auth-subtitle">Escolha como você quer usar o app.</p>

        <div className="role-switch">
          <button type="button" className={role === 'passenger' ? 'is-active' : ''} onClick={() => setRole('passenger')}>
            Passageiro
          </button>
          <button type="button" className={role === 'driver' ? 'is-active' : ''} onClick={() => setRole('driver')}>
            Motociclista
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input label="Nome completo" name="fullName" required value={form.fullName} onChange={update('fullName')} />
          <Input label="E-mail" type="email" name="email" required value={form.email} onChange={update('email')} />
          <Input label="Telefone" name="phone" placeholder="(00) 00000-0000" value={form.phone} onChange={update('phone')} />

          <div className="field-row">
            <Input label="Senha" type="password" name="password" required value={form.password} onChange={update('password')} />
            <Input label="Confirmar senha" type="password" name="confirmPassword" required value={form.confirmPassword} onChange={update('confirmPassword')} />
          </div>

          {role === 'driver' ? (
            <fieldset className="fieldset">
              <legend>Dados da moto</legend>
              <div className="field-row">
                <Input label="Marca" name="brand" required value={form.brand} onChange={update('brand')} />
                <Input label="Modelo" name="model" required value={form.model} onChange={update('model')} />
              </div>
              <div className="field-row">
                <Input label="Ano" name="year" type="number" value={form.year} onChange={update('year')} />
                <Input label="Cor" name="color" value={form.color} onChange={update('color')} />
              </div>
              <Input label="Placa" name="plate" required value={form.plate} onChange={update('plate')} />
            </fieldset>
          ) : null}

          {error ? <p className="form-error">{error}</p> : null}

          <Button type="submit" fullWidth loading={loading}>
            {role === 'driver' ? 'Quero ser motociclista' : 'Criar conta'}
          </Button>
        </form>

        <div className="auth-links">
          <Link to="/entrar">Já tenho conta</Link>
        </div>
      </div>
    </div>
  )
}
