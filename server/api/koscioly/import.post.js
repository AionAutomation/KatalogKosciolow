/**
 * POST /api/koscioly/import – import kościoła z pełnym JSON (adres, organizacja, dekanat, cechy, nabożeństwa, duchowieństwo).
 * Używa upsertChurchData – słowniki GEO i powiązane są normalizowane (getOrCreate*), zapis O2M dwufazowy.
 */
import { createDirectusClient } from '#config/AuthService.js'
import { upsertChurchData } from '../../utils/upsert-dictionaries.js'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  if (method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  let body
  try {
    body = await readBody(event)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Nieprawidłowy JSON' })
  }

  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Oczekiwano obiektu JSON' })
  }

  if (!body.nazwa || typeof body.nazwa !== 'string' || !body.nazwa.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Pole "nazwa" jest wymagane' })
  }

  const config = useRuntimeConfig()
  const directus = createDirectusClient({
    url: config.directus?.url || 'http://localhost:8056',
    token: config.directus?.token,
  })

  try {
    const result = await upsertChurchData(directus, body)
    setResponseStatus(event, 201)
    return result
  } catch (err) {
    const msg =
      err.response?.data?.errors?.[0]?.message ??
      err.response?.data?.message ??
      err.message ??
      'Błąd Directus'
    throw createError({ statusCode: 500, statusMessage: msg })
  }
})
