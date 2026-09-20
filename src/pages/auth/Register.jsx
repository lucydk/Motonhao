import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { signUp } from '../../services/authService'
import { useToast } from '../../context/ToastContext'
import { formatCpf, isValidCpf, onlyDigits, formatPhone, formatPlate } from '../../utils/cpf'

const CURRENT_YEAR = new Date().getFullYear()

export default function Register() {
  const [role, setRole] = useState('passenger')
  const [form, setForm] = useState({
    fullName: '', cpf: '', email: '', phone: '', password: '', confirmPassword: '',
    brand: '', model: '', year: '', color: '', plate: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  // Campos que já saem formatados enquanto a pessoa digita
  function updateMasked(field, mask) {
    return (e) => setForm({ ...form, [field]: mask(e.target.value) })
  }

  function validate() {
    if (!form.fullName.trim().includes(' ')) {
      return 'Digite seu nome completo (nome e sobrenome).'
    }
    if (!isValidCpf(form.cpf)) {
      return 'CPF inválido. Confira os números digitados.'
    }
    if (onlyDigits(form.phone).length < 10) {
      return 'Digite um telefone válido com DDD.'
    }
    if (form.password !== form.confirmPassword) {
      return 'As senhas não coincidem.'
    }
    if (form.password.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres.'
    }

    if (role === 'driver') {
      if (!form.brand.trim() || !form.model.trim()) {
        return 'Informe a marca e o modelo da sua moto.'
      }
      if (form.plate.length !== 7) {
        return 'A placa deve ter 7 caracteres (ex: ABC1D23).'
      }
      const year = Number(form.year)
      if (!year || year < 1970 || year > CURRENT_YEAR + 1) {
        return `Informe o ano da moto (entre 1970 e ${CURRENT_YEAR + 1}).`
      }
    }

    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const message = validate()
    if (message) {
      setError(message)
      return
    }
    setError('')

    setLoading(true)
    try {
      await signUp({
        fullName: form.fullName.trim(),
        cpf: onlyDigits(form.cpf),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
        role,
        driver: role === 'driver' ? {
          brand: form.brand, model: form.model, year: form.year, color: form.color, plate: form.plate
        } : undefined
      })
      showToast(
        role === 'driver'
          ? 'Conta criada! Agora entre para enviar sua foto e os documentos.'
          : 'Conta criada! Verifique seu e-mail se a confirmação estiver ativa.',
        'success'
      )
      navigate('/entrar', { replace: true })
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
          <fieldset className="fieldset">
            <legend>Dados pessoais</legend>
            <Input label="Nome completo" name="fullName" required autoComplete="name"
              value={form.fullName} onChange={update('fullName')} />
            <div className="field-row">
              <Input label="CPF" name="cpf" required inputMode="numeric" placeholder="000.000.000-00"
                value={form.cpf} onChange={updateMasked('cpf', formatCpf)} />
              <Input label="Telefone" name="phone" required inputMode="tel" placeholder="(00) 00000-0000"
                value={form.phone} onChange={updateMasked('phone', formatPhone)} />
            </div>
            <Input label="E-mail" type="email" name="email" required autoComplete="email"
              value={form.email} onChange={update('email')} />
            <div className="field-row">
              <Input label="Senha" type="password" name="password" required autoComplete="new-password"
                value={form.password} onChange={update('password')} />
              <Input label="Confirmar senha" type="password" name="confirmPassword" required autoComplete="new-password"
                value={form.confirmPassword} onChange={update('confirmPassword')} />
            </div>
          </fieldset>

          {role === 'driver' ? (
            <>
              <fieldset className="fieldset">
                <legend>Dados da moto</legend>
                <div className="field-row">
                  <Input label="Marca" name="brand" required placeholder="Ex: Honda"
                    value={form.brand} onChange={update('brand')} />
                  <Input label="Modelo" name="model" required placeholder="Ex: CG 160 Fan"
                    value={form.model} onChange={update('model')} />
                </div>
                <div className="field-row">
                  <Input label="Ano" name="year" type="number" required min="1970" max={CURRENT_YEAR + 1}
                    placeholder={String(CURRENT_YEAR)} value={form.year} onChange={update('year')} />
                  <Input label="Cor" name="color" placeholder="Ex: Vermelha"
                    value={form.color} onChange={update('color')} />
                </div>
                <Input label="Placa" name="plate" required placeholder="ABC1D23"
                  hint="Só letras e números, sem hífen."
                  value={form.plate} onChange={updateMasked('plate', formatPlate)} />
              </fieldset>

              <div className="next-step-note">
                <strong>📎 Falta pouco</strong>
                <span>
                  Depois de entrar, você envia a foto de perfil, a foto da CNH, a foto da
                  moto e o documento dela (CRLV). São só quatro fotos, dá pra tirar na hora
                  pelo celular.
                </span>
              </div>
            </>
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
