/**
 * POST /items/kosciol_katolicki – zgodna z Directus ścieżka do importu kościoła.
 * Przyjmuje pełny JSON (adres, organizacja, dekanat, cechy, nabożeństwa, duchowieństwo),
 * transformuje i zapisuje w Directus. Zapis O2M (nabozenstwo, duchowienstwo, itd.) realizowany
 * dwufazowo: najpierw kościół, potem rekordy w kolekcjach potomnych z kosciol_id.
 */
import { createDirectusClient } from '#config/AuthService.js'
import { transformPayload, splitPayloadForO2M } from '../../utils/import-kosciol.js'

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

  const fullPayload = transformPayload(body)
  const { mainPayload, o2mItems } = splitPayloadForO2M(fullPayload)

  try {
    const res = await directus.post(`/items/${COLLECTION}`, mainPayload)
    const data = res?.data ?? res
    const item = Array.isArray(data) ? data[0] : data
    const churchId = item?.id
    if (!churchId) {
      setResponseStatus(event, 201)
      return data
    }

    for (const [key, rows] of Object.entries(o2mItems)) {
      for (const row of rows) {
        await directus.post(`/items/${key}`, { ...row, kosciol_id: churchId })
      }
    }

    setResponseStatus(event, 201)
    return { ...item, id: churchId }
  } catch (err) {
    const msg =
      err.response?.data?.errors?.[0]?.message ??
      err.response?.data?.message ??
      err.message ??
      'Błąd Directus'
    throw createError({ statusCode: 500, statusMessage: msg })
  }
})
