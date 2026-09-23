import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { uploadDriverDocument, getDocumentUrl, hasAllDocuments } from '../../services/documentService'
import PhotoField from '../../components/PhotoField'
import SignOutButton from '../../components/SignOutButton'
import Button from '../../components/Button'
import Loading from '../../components/Loading'

// Passo do cadastro do motociclista: CNH, foto da moto e CRLV.
// Fica depois da foto de perfil e antes de poder rodar — quem já enviou
// tudo nunca mais vê esta tela.
export default function DriverDocuments() {
  const { driver, user, role, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [pending, setPending] = useState({ cnh: null, moto: null, crlv: null })
  const [previews, setPreviews] = useState({})
  const [saving, setSaving] = useState(false)

  // Mostra o que já foi enviado antes (link temporário do bucket privado)
  useEffect(() => {
    if (!driver) return
    let cancelled = false
    const entries = [
      ['cnh', driver.cnh_photo_path],
      ['moto', driver.motorcycle_photo_path],
      ['crlv', driver.crlv_photo_path]
    ]

    Promise.all(entries.map(([kind, path]) => getDocumentUrl(path).then((url) => [kind, url])))
      .then((results) => {
        if (cancelled) return
        setPreviews(Object.fromEntries(results.filter(([, url]) => url)))
      })

    return () => { cancelled = true }
  }, [driver])

  if (role !== 'driver') return <Navigate to="/" replace />
  if (!driver) return <Loading fullScreen label="Carregando seu cadastro…" />
  if (hasAllDocuments(driver)) return <Navigate to="/driver" replace />

  const missing = ['cnh', 'moto', 'crlv'].filter(
    (kind) => !pending[kind] && !previews[kind]
  )

  async function handleSave() {
    setSaving(true)
    try {
      for (const kind of ['cnh', 'moto', 'crlv']) {
        if (pending[kind]) {
          await uploadDriverDocument({ userId: user.id, driverId: driver.id, kind, blob: pending[kind] })
        }
      }
      await refreshProfile()
      showToast('Documentos enviados! Cadastro completo.', 'success')
      navigate('/driver', { replace: true })
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="page-header-top">
          <span />
          <SignOutButton />
        </div>

        <h1>Seus documentos</h1>
        <p className="auth-subtitle">
          Falta só isso pra você começar a rodar. As fotos ficam guardadas em modo
          privado — só você e a administração do Motonhão conseguem abrir.
        </p>

        <PhotoField
          label="Foto da CNH"
          hint="Frente aberta, com a foto e o número legíveis. Precisa ter a categoria A."
          currentUrl={previews.cnh}
          done={!!driver.cnh_photo_path}
          disabled={saving}
          onChange={(blob) => setPending((p) => ({ ...p, cnh: blob }))}
        />

        <PhotoField
          label="Foto da moto"
          hint="A moto inteira, de lado, com a placa aparecendo."
          currentUrl={previews.moto}
          done={!!driver.motorcycle_photo_path}
          disabled={saving}
          onChange={(blob) => setPending((p) => ({ ...p, moto: blob }))}
        />

        <PhotoField
          label="Documento da moto (CRLV)"
          hint="O CRLV do ano vigente, digital ou impresso, com os dados legíveis."
          currentUrl={previews.crlv}
          done={!!driver.crlv_photo_path}
          disabled={saving}
          onChange={(blob) => setPending((p) => ({ ...p, crlv: blob }))}
        />

        {missing.length ? (
          <p className="page-subtitle">Ainda falta{missing.length > 1 ? 'm' : ''} {missing.length} foto{missing.length > 1 ? 's' : ''}.</p>
        ) : null}

        <Button fullWidth loading={saving} disabled={missing.length > 0} onClick={handleSave}>
          Enviar e concluir cadastro
        </Button>
      </div>
    </div>
  )
}
