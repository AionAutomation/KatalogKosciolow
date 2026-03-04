/**
 * GET /api/koscioly – lista kościołów z Directus.
 * Query: ?limit=6&sort=-date_created (ostatnio dodane), ?miasto=, ?region=, ?kategoria=
 */
import { createDirectusClient } from '#config/AuthService.js'

const COLLECTION = 'kosciol_katolicki'

function parseItems(res) {
  const data = res?.data ?? res
  return Array.isArray(data) ? data : (data?.data ?? [])
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = query.limit ? Math.min(parseInt(query.limit, 10) || 100, 500) : -1
  const sort = query.sort || 'nazwa'

  const config = useRuntimeConfig()
  const directus = createDirectusClient({
    url: config.directus?.url || 'http://localhost:8056',
    token: config.directus?.token,
  })

  const params = {
    fields: 'id,nazwa,slug',
    limit: limit > 0 ? limit : -1,
    sort,
  }
  if (query.q && String(query.q).trim()) {
    params['filter[nazwa][_icontains]'] = String(query.q).trim()
  }

  try {
    const res = await directus.get(`/items/${COLLECTION}`, {
      params,
    })
    return parseItems(res)
  } catch (err) {
    const msg = err.response?.data?.errors?.[0]?.message || err.message || 'Błąd Directus'
    throw createError({ statusCode: 500, statusMessage: msg })
  }
})
