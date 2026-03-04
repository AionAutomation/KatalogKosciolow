/**
 * GET /api/regiony/:slug – kościoły w danym regionie (przez miasto).
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
    const regionRes = await directus.get('/items/region', {
      params: { 'filter[slug][_eq]': slug, fields: 'id', limit: 1 },
    })
    const regiony = parseItems(regionRes)
    const region = regiony[0]
    if (!region) throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono regionu' })

    const res = await directus.get('/items/kosciol_katolicki', {
      params: {
        'filter[adres_id][miasto_id][region_id][_eq]': region.id,
        fields: 'id,nazwa,slug',
        limit: -1,
        sort: 'nazwa',
      },
    })
    return parseItems(res)
  } catch (err) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono regionu' })
  }
})
