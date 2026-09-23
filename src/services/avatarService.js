import { supabase } from '../lib/supabase'
import { updateProfile } from './profileService'

const BUCKET = 'avatars'
const MAX_INPUT_BYTES = 15 * 1024 * 1024 // foto de celular pode ser grande; a gente reduz antes de enviar

// Carrega a imagem respeitando a rotação do EXIF (foto de celular "deitada").
async function loadBitmap(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    // Navegadores mais antigos: cai para <img>
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return img
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

// Recorta a foto num quadrado centralizado e reduz para 512x512 JPEG.
// Fica leve (~50–90 KB), padronizada e sem lixo de EXIF (localização da foto etc).
export async function fileToSquareBlob(file, size = 512, quality = 0.86) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem.')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Essa foto é muito grande. Escolha uma de até 15 MB.')
  }

  let source
  try {
    source = await loadBitmap(file)
  } catch {
    throw new Error('Não consegui abrir essa imagem. Tente outra foto.')
  }

  const width = source.width
  const height = source.height
  const side = Math.min(width, height)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  canvas.getContext('2d').drawImage(
    source,
    (width - side) / 2, (height - side) / 2, side, side,
    0, 0, size, size
  )
  source.close?.()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível processar a foto.'))),
      'image/jpeg',
      quality
    )
  })
}

// Envia para o Storage e grava a URL em profiles.avatar_url.
// Um arquivo por usuário (upsert), com ?v=timestamp na URL pra furar o cache
// quando a pessoa troca de foto.
export async function uploadAvatar(userId, blob) {
  const path = `${userId}/avatar.jpg`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' })

  if (error) {
    if (/bucket not found/i.test(error.message)) {
      throw new Error('O armazenamento de fotos ainda não foi configurado (rode sql/migration_avatars.sql no Supabase).')
    }
    throw error
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const url = `${data.publicUrl}?v=${Date.now()}`

  await updateProfile(userId, { avatar_url: url })
  return url
}

// ---------------------------------------------------------------
// Foto de DOCUMENTO (CNH, moto, CRLV): aqui não dá pra recortar em
// quadrado — cortaria justamente a informação. Então só reduzimos
// mantendo a proporção original, pra ficar leve e ainda legível.
// ---------------------------------------------------------------
export async function fileToPhotoBlob(file, maxSide = 1400, quality = 0.85) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem.')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Essa foto é muito grande. Escolha uma de até 15 MB.')
  }

  let source
  try {
    source = await loadBitmap(file)
  } catch {
    throw new Error('Não consegui abrir essa imagem. Tente outra foto.')
  }

  const scale = Math.min(1, maxSide / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(source.width * scale)
  canvas.height = Math.round(source.height * scale)
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)
  source.close?.()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível processar a foto.'))),
      'image/jpeg',
      quality
    )
  })
}
