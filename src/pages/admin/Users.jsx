import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Loading from '../../components/Loading'

const ROLE_LABEL = { passenger: 'Passageiro', driver: 'Motociclista', admin: 'Administrador' }

export default function Users() {
  const [users, setUsers] = useState(null)

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setUsers(data || []))
  }, [])

  if (!users) return <Loading fullScreen label="Carregando usuários…" />

  return (
    <div className="page">
      <h1>Usuários</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Perfil</th><th>Criado em</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.phone || '—'}</td>
                <td><span className={`role-badge role-${u.role}`}>{ROLE_LABEL[u.role] || u.role}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
