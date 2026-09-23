import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar'
import { fileToSquareBlob } from '../services/avatarService'

// Escolha de foto: "Tirar foto" abre a câmera frontal no celular; "Galeria"
// abre o seletor de arquivos. A foto já sai recortada em quadrado (blob) via onChange.
export default function AvatarPicker({ name, currentUrl, onChange, disabled = false, size = 132 }) {
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  // Libera a URL temporária da prévia anterior quando ela muda ou o componente sai.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite escolher a mesma foto de novo
    if (!file) return

    setError('')
    try {
      const blob = await fileToSquareBlob(file)
      setPreview(URL.createObjectURL(blob))
      onChange?.(blob)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="avatar-picker">
      <Avatar src={preview || currentUrl} name={name} size={size} ring />

      <div className="avatar-picker-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={disabled}
          onClick={() => cameraRef.current?.click()}
        >
          📷 Tirar foto
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={disabled}
          onClick={() => galleryRef.current?.click()}
        >
          🖼️ Galeria
        </button>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="user" hidden onChange={handleFile} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handleFile} />

      {error ? <p className="form-error">{error}</p> : null}
    </div>
  )
}
