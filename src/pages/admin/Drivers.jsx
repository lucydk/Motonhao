import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { approveDriver, rejectDriver } from '../../services/driverService'
import { useToast } from '../../context/ToastContext'
import Loading from '../../components/Loading'
import Avatar from '../../components/Avatar'
import { getDocumentUrl } from '../../services/documentService'

// Abre o documento num link temporário — o bucket é privado, então não
// existe URL fixa para CNH ou CRLV.
function DocumentLink({ path, label }) {
  const [busy, setBusy] = useState(false)

  if (!path) return <span className="doc-missing">{label}: faltando</span>

  async function open() {
    setBusy(true)
    const url = await getDocumentUrl(path, 120)
    setBusy(false)
    if (url) window.open(url, '_blank', 'noopener')
  }

  return (
    <button type="button" className="doc-link" onClick={open} disabled={busy}>
      {busy ? 'abrindo…' : label}
    </button>
  )
}

const STATUS_LABEL = {
  pending: { label: 'Pendente', className: 'verification-pending' },
  approved: { label: 'Aprovado', className: 'verification-approved' },
  rejected: { label: 'Reprovado', className: 'verification-rejected' }
}

export default function Drivers() {
  const [drivers, setDrivers] = useState(null)
  const [actingId, setActingId] = useState(null)
  const { showToast } = useToast()

  useEffect(() => {
    loadDrivers()
  }, [])

  function loadDrivers() {
    supabase
      .from('drivers')
      .select('*, profile:profiles(full_name, email, phone, avatar_url, cpf)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setDrivers(data || []))
  }

  async function handleApprove(driverId) {
    setActingId(driverId)
    try {
      const updated = await approveDriver(driverId)
      setDrivers((prev) => prev.map((d) => (d.id === driverId ? { ...d, ...updated } : d)))
      showToast('Motociclista aprovado.', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActingId(null)
    }
  }

  async function handleReject(driverId) {
    const note = window.prompt('Motivo da reprovação (opcional):') || ''
    setActingId(driverId)
    try {
      const updated = await rejectDriver(driverId, note)
      setDrivers((prev) => prev.map((d) => (d.id === driverId ? { ...d, ...updated } : d)))
      showToast('Motociclista reprovado.', 'info')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActingId(null)
    }
  }

  if (!drivers) return <Loading fullScreen label="Carregando motociclistas…" />

  return (
    <div className="page">
      <h1>Motociclistas</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nome</th><th>CPF</th><th>Moto</th><th>Placa</th><th>Documentos</th>
              <th>Avaliação</th><th>Corridas</th><th>Online</th><th>Verificação</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => {
              const status = STATUS_LABEL[d.verification_status] || STATUS_LABEL.pending
              return (
                <tr key={d.id}>
                  <td>
                    <span className="admin-person">
                      <Avatar src={d.profile?.avatar_url} name={d.profile?.full_name || ''} size={32} />
                      {d.profile?.full_name}
                    </span>
                  </td>
                  <td>{d.profile?.cpf || '—'}</td>
                  <td>{d.motorcycle_brand} {d.motorcycle_model} {d.motorcycle_year || ''}</td>
                  <td>{d.license_plate}</td>
                  <td className="doc-cell">
                    <DocumentLink path={d.cnh_photo_path} label="CNH" />
                    <DocumentLink path={d.motorcycle_photo_path} label="Moto" />
                    <DocumentLink path={d.crlv_photo_path} label="CRLV" />
                  </td>
                  <td>⭐ {Number(d.rating).toFixed(1)}</td>
                  <td>{d.total_rides}</td>
                  <td>{d.is_online ? <span className="status-online">Online</span> : <span className="status-offline">Offline</span>}</td>
                  <td>
                    <span className={`verification-badge ${status.className}`}>{status.label}</span>
                    {d.verification_status === 'rejected' && d.verification_note ? (
                      <div className="verification-note">{d.verification_note}</div>
                    ) : null}
                  </td>
                  <td className="admin-actions">
                    {d.verification_status !== 'approved' ? (
                      <button
                        type="button"
                        className="admin-action-btn admin-action-approve"
                        disabled={actingId === d.id}
                        onClick={() => handleApprove(d.id)}
                      >
                        Aprovar
                      </button>
                    ) : null}
                    {d.verification_status !== 'rejected' ? (
                      <button
                        type="button"
                        className="admin-action-btn admin-action-reject"
                        disabled={actingId === d.id}
                        onClick={() => handleReject(d.id)}
                      >
                        Reprovar
                      </button>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
