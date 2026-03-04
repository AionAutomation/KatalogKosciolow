/**
 * GET /api/blog/:slug – szczegóły posta bloga.
 */
import { createDirectusClient } from '#config/AuthService.js'
import { parseItems } from '../../utils/directus.js'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Brak slug' })

  const config = useRuntimeConfig()
  const directus = createDirectusClient({
    url: config.directus?.url || 'http://localhost:8056',
    token: config.directus?.token,
  })

  try {
    const res = await directus.get('/items/blog_post', {
      params: {
        'filter[slug][_eq]': slug,
        fields: '*,obraz_id.*',
        limit: 1,
      },
    })
    const items = parseItems(res)
    const post = items[0]
    if (!post) throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono posta' })
    return post
  } catch (err) {
    if (err.statusCode) throw err
    const msg = err.response?.data?.errors?.[0]?.message || err.message || 'Błąd Directus'
    throw createError({ statusCode: 500, statusMessage: msg })
  }
})
