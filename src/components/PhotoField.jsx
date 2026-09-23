import { useEffect, useRef, useState } from 'react'
import { fileToPhotoBlob } from '../services/avatarService'

// Campo de foto de documento (CNH, moto, CRLV).
// "Tirar foto" abre a câmera traseira no celular; "Galeria" abre os arquivos.
// A imagem já sai reduzida (blob) pelo onChange — nada de arquivo de 8 MB.
export default function PhotoField({
  label,
  hint,
  currentUrl,
  onChange,
  disabled = false,
  done = false
}) {
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError('')
    try {
      const blob = await fileToPhotoBlob(file)
      setPreview(URL.createObjectURL(blob))
      onChange?.(blob)
    } catch (err) {
      setError(err.message)
    }
  }

  const image = preview || currentUrl

  return (
    <div className="photo-field">
      <div className="photo-field-head">
        <span className="photo-field-label">{label}</span>
        {done || preview ? <span className="photo-field-ok">✓ enviada</span> : null}
      </div>

      <div className={`photo-field-frame ${image ? 'has-image' : ''}`}>
        {image ? (
          <img src={image} alt={label} />
        ) : (
          <span className="photo-field-placeholder" aria-hidden="true">📄</span>
        )}
      </div>

      {hint ? <p className="photo-field-hint">{hint}</p> : null}

      <div className="photo-field-actions">
        <button type="button" className="btn btn-primary btn-sm" disabled={disabled} onClick={() => cameraRef.current?.click()}>
          📷 Tirar foto
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={disabled} onClick={() => galleryRef.current?.click()}>
          🖼️ Galeria
        </button>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handleFile} />

      {error ? <p className="form-error">{error}</p> : null}
    </div>
  )
}
