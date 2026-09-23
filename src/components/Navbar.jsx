import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homeRouteFor } from '../config/routes'
import Logo from './Logo'
import Avatar from './Avatar'

export default function Navbar() {
  const { isAuthenticated, profile, role, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const firstName = profile?.full_name?.split(' ')[0] || '...'

  return (
    <header className="navbar">

      <Logo to="/" />

      <nav className="navbar-links">
        <Link to="/#como-funciona">Como funciona</Link>
        <Link to="/#seguranca">Segurança</Link>
        <Link to="/#sobre">Sobre</Link>
      </nav>

      <div className="navbar-actions">
        {isAuthenticated ? (
          <>
            {/* Atalho de volta para o app: foto + nome levam ao painel da pessoa */}
            <Link to={homeRouteFor(role)} className="navbar-me">
              <Avatar src={profile?.avatar_url} name={profile?.full_name || ''} size={34} />
              <span className="navbar-user">Olá, {firstName}</span>
            </Link>

            <button
              className="btn btn-ghost btn-sm"
              onClick={handleSignOut}
            >
              Sair
            </button>
          </>
        ) : (
          <Link
            to="/entrar"
            className="btn btn-primary btn-sm"
          >
            Entrar
          </Link>
        )}
      </div>

    </header>
  )
}
