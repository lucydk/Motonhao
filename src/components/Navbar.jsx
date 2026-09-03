import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        Moton<span>hão</span>
      </Link>

      <nav className="navbar-links">
        <Link to="/#como-funciona">Como funciona</Link>
        <Link to="/#seguranca">Segurança</Link>
        <Link to="/#sobre">Sobre</Link>
      </nav>

      <div className="navbar-actions">
        {isAuthenticated ? (
          <>
            <span className="navbar-user">Olá, {profile?.full_name?.split(' ')[0] || '...'}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>Sair</button>
          </>
        ) : (
          <Link to="/entrar" className="btn btn-primary btn-sm">Entrar</Link>
        )}
      </div>
    </header>
  )
}
