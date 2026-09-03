import { useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { requestPasswordReset } from '../../services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Recuperar senha</h1>
        <p className="auth-subtitle">Enviaremos um link de redefinição para o seu e-mail.</p>

        {sent ? (
          <p className="form-success">Se o e-mail existir, você receberá um link em instantes.</p>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <Input label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            {error ? <p className="form-error">{error}</p> : null}
            <Button type="submit" fullWidth loading={loading}>Enviar link</Button>
          </form>
        )}

        <div className="auth-links">
          <Link to="/entrar">Voltar para o login</Link>
        </div>
      </div>
    </div>
  )
}
