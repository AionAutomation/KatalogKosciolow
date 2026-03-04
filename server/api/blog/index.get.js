/**
 * GET /api/blog – lista postów bloga (paginator).
 */
import { createDirectusClient } from '#config/AuthService.js'
import { parseItems } from '../../utils/directus.js'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100)
  const page = Math.max(parseInt(query.page, 10) || 1, 1)
  const offset = (page - 1) * limit

  const config = useRuntimeConfig()
  const directus = createDirectusClient({
    url: config.directus?.url || 'http://localhost:8056',
    token: config.directus?.token,
  })

  try {
    const res = await directus.get('/items/blog_post', {
      params: {
        fields: 'id,slug,tytul,opis_seo,dataPublikacji,obraz_id',
        limit,
        offset,
        sort: '-dataPublikacji',
      },
    })
    const items = parseItems(res)
    return { items: Array.isArray(items) ? items : [], page, limit }
  } catch {
    return { items: [], page: 1, limit }
  }
})
