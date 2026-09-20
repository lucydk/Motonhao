import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { updatePassword } from '../../services/authService'
import { useToast } from '../../context/ToastContext'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      showToast('Senha redefinida com sucesso!', 'success')
      navigate('/entrar')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Definir nova senha</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <Input label="Nova senha" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Confirmar nova senha" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error ? <p className="form-error">{error}</p> : null}
          <Button type="submit" fullWidth loading={loading}>Salvar nova senha</Button>
        </form>
      </div>
    </div>
  )
}
