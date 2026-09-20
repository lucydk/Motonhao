import { NavLink } from 'react-router-dom'

const PASSENGER_ITEMS = [
  { to: '/passenger', label: 'Início', icon: '🏠', end: true },
  { to: '/passenger/rides', label: 'Corridas', icon: '📋' },
  { to: '/passenger/profile', label: 'Perfil', icon: '👤' }
]

const DRIVER_ITEMS = [
  { to: '/driver', label: 'Início', icon: '🏠', end: true },
  { to: '/driver/earnings', label: 'Ganhos', icon: '💰' },
  { to: '/driver/profile', label: 'Perfil', icon: '👤' }
]

export default function BottomNavigation({ role }) {
  const items = role === 'driver' ? DRIVER_ITEMS : PASSENGER_ITEMS

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'is-active' : ''}`}
        >
          <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
