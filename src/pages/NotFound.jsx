import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Essa rota não existe no Motonhão.</p>
      <Link className="btn btn-primary" to="/">Voltar para o início</Link>
    </div>
  )
}
