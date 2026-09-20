// Tela inicial de cada tipo de conta dentro do app.
// Usada pela landing, navbar, layouts e rotas protegidas, pra ninguém
// precisar repetir (e errar) esse mapa em vários arquivos.
const HOME_ROUTE = {
  passenger: '/passenger',
  driver: '/driver',
  admin: '/admin'
}

export function homeRouteFor(role) {
  return HOME_ROUTE[role] || '/passenger'
}
