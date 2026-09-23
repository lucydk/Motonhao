import { supabase } from '../lib/supabase'

// ---------------------------------------------------------------
// CNH, foto da moto e CRLV.
// Ficam num bucket PRIVADO: no banco guardamos só o caminho do arquivo,
// e a imagem só é aberta por um link temporário gerado na hora — para o
// dono do documento ou para o administrador.
// ---------------------------------------------------------------

const BUCKET = 'documents'

export const DOCUMENT_KINDS = {
  cnh: { field: 'cnh_photo_path', label: 'Foto da CNH' },
  moto: { field: 'motorcycle_photo_path', label: 'Foto da moto' },
  crlv: { field: 'crlv_photo_path', label: 'Documento da moto (CRLV)' }
}

export async function uploadDriverDocument({ userId, driverId, kind, blob }) {
  const config = DOCUMENT_KINDS[kind]
  if (!config) throw new Error('Tipo de documento inválido.')

  const path = `${userId}/${kind}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

  if (uploadError) {
    if (/bucket not found/i.test(uploadError.message)) {
      throw new Error('O armazenamento de documentos ainda não foi configurado (rode sql/migration_cadastro_documentos.sql no Supabase).')
    }
    throw uploadError
  }

  const { error } = await supabase
    .from('drivers')
    .update({ [config.field]: path, documents_submitted_at: new Date().toISOString() })
    .eq('id', driverId)

  if (error) throw error
  return path
}

// Link temporário (1 hora) para visualizar um documento guardado.
export async function getDocumentUrl(path, expiresInSeconds = 3600) {
  if (!path) return null
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error) return null
  return data.signedUrl
}

// O cadastro do motociclista só está completo com os três documentos.
export function hasAllDocuments(driver) {
  return Boolean(driver?.cnh_photo_path && driver?.motorcycle_photo_path && driver?.crlv_photo_path)
}
