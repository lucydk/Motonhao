import { useEffect, useState } from 'react'

// Foto redonda do usuário. Se não houver foto (ou ela falhar ao carregar),
// cai para a inicial do nome — nunca mostra imagem quebrada.
export default function Avatar({ src, name = '', size = 48, ring = false, className = '' }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <span
      className={`avatar ${ring ? 'avatar-ring' : ''} ${className}`.trim()}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name ? `Foto de ${name}` : 'Foto do usuário'}
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  )
}
