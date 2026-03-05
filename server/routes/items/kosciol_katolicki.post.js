/**
 * POST /items/kosciol_katolicki – zgodna z Directus ścieżka do importu kościoła.
 * Przyjmuje pełny JSON (adres, organizacja, dekanat, cechy, nabożeństwa, duchowieństwo),
 * transformuje i zapisuje w Directus. Umożliwia wysyłanie bezpośrednio na tę ścieżkę.
 */
import { createDirectusClient } from '#config/AuthService.js'
import { transformPayload } from '../../utils/import-kosciol.js'

const COLLECTION = 'kosciol_katolicki'

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

  const payload = transformPayload(body)

  try {
    const res = await directus.post(`/items/${COLLECTION}`, payload)
    const data = res?.data ?? res
    setResponseStatus(event, 201)
    return data
  } catch (err) {
    const msg =
      err.response?.data?.errors?.[0]?.message ??
      err.response?.data?.message ??
      err.message ??
      'Błąd Directus'
    throw createError({ statusCode: 500, statusMessage: msg })
  }
})
