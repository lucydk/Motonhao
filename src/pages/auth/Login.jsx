import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { signIn } from '../../services/authService'
import { useToast } from '../../context/ToastContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(form)
      showToast('Login realizado com sucesso!', 'success')
      const redirectTo = location.state?.from || '/passenger'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Entrar no Motonhão</h1>
        <p className="auth-subtitle">Sua corrida. Do seu jeito.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="E-mail"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Senha"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {error ? <p className="form-error">{error}</p> : null}

          <Button type="submit" fullWidth loading={loading}>Entrar</Button>
        </form>

        <div className="auth-links">
          <Link to="/esqueci-senha">Esqueci minha senha</Link>
          <Link to="/cadastro">Criar conta</Link>
        </div>
      </div>
    </div>
  )
}
