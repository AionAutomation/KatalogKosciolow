/**
 * GET /api/kategorie/:slug – kościoły w danej kategorii (M2M przez kosciol_kategoria).
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
    const katRes = await directus.get('/items/kategoria', {
      params: { 'filter[slug][_eq]': slug, fields: 'id', limit: 1 },
    })
    const kategorie = parseItems(katRes)
    const kategoria = kategorie[0]
    if (!kategoria) throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono kategorii' })

    const juncRes = await directus.get('/items/kosciol_kategoria', {
      params: {
        'filter[kategoria_id][_eq]': kategoria.id,
        fields: 'kosciol_id',
        limit: -1,
      },
    })
    const junc = parseItems(juncRes)
    const ids = junc.map((j) => j.kosciol_id).filter(Boolean)
    if (ids.length === 0) return []

    const res = await directus.get('/items/kosciol_katolicki', {
      params: {
        'filter[id][_in]': ids.join(','),
        fields: 'id,nazwa,slug',
        limit: -1,
        sort: 'nazwa',
      },
    })
    return parseItems(res)
  } catch (err) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono kategorii' })
  }
})
