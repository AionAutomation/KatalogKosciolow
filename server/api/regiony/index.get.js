/**
 * GET /api/regiony – lista regionów (województw) z Directus.
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
    const res = await directus.get('/items/region', {
      params: { fields: 'id,slug,nazwa', limit: -1, sort: 'nazwa' },
    })
    return parseItems(res)
  } catch {
    return []
  }
})
