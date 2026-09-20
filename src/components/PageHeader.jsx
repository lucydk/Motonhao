import { Link } from 'react-router-dom'

// Cabeçalho padrão das telas internas.
// backTo: para onde o "voltar" leva. É um destino FIXO (a tela-mãe), não o
// histórico do navegador — assim ninguém precisa voltar cinco vezes pra sair
// de um fluxo de três passos.
export default function PageHeader({ title, subtitle, backTo, backLabel = 'Voltar', actions }) {
  return (
    <header className="page-header">
      <div className="page-header-top">
        {backTo ? (
          <Link to={backTo} className="page-back" replace>← {backLabel}</Link>
        ) : <span />}
        {actions ? <div className="page-header-actions">{actions}</div> : null}
      </div>
      {title ? <h1>{title}</h1> : null}
      {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
    </header>
  )
}
