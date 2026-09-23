import { Link } from 'react-router-dom'

// Logo única do Motonhão. Navbar (deslogado) e topbar do app (logado) usam
// este mesmo componente, então a aparência nunca mais diverge entre os dois.
export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="navbar-brand" aria-label="Motonhão">
      <span className="logo-moto">MOTO</span>
      <span className="logo-nhao">NHÃO</span>
    </Link>
  )
}
