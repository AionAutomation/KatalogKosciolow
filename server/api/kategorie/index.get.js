/**
 * GET /api/kategorie – lista kategorii z Directus.
 */
import { createDirectusClient } from '#config/AuthService.js'
import { parseItems } from '../../utils/directus.js'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const directus = createDirectusClient({
    url: config.directus?.url || 'http://localhost:8056',
    token: config.directus?.token,
  })

  try {
    const res = await directus.get('/items/kategoria', {
      params: { fields: 'id,slug,nazwa,opis', limit: -1, sort: 'nazwa' },
    })
    return parseItems(res)
  } catch {
    return []
  }
})
