/**
 * GET /api/miasta/:slug – kościoły w danym mieście (z miasto_id lub po miejscowości).
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
    const miastoRes = await directus.get('/items/miasto', {
      params: { 'filter[slug][_eq]': slug, fields: 'id,nazwa', limit: 1 },
    })
    const miasta = parseItems(miastoRes)
    const miasto = miasta[0]

    if (miasto) {
      const res = await directus.get('/items/kosciol_katolicki', {
        params: {
          'filter[adres_id][miasto_id][_eq]': miasto.id,
          fields: 'id,nazwa,slug',
          limit: -1,
          sort: 'nazwa',
        },
      })
      return parseItems(res)
    }
  } catch {
    // Kolekcja miasto nie istnieje – fallback po miejscowości
  }

  try {
    const res = await directus.get('/items/kosciol_katolicki', {
      params: { fields: 'id,nazwa,slug,adres_id.miejscowosc', limit: -1 },
    })
    const koscioly = parseItems(res)
    const slugNorm = slug.toLowerCase().replace(/-/g, ' ')
    return koscioly.filter((k) => {
      const m = k.adres_id?.miejscowosc ?? ''
      const miejscowosc = String(m || '').trim().toLowerCase()
      const miejscowoscSlug = miejscowosc.replace(/\s+/g, '-')
      return miejscowosc && (miejscowoscSlug === slug || miejscowosc === slugNorm)
    }).sort((a, b) => (a.nazwa || '').localeCompare(b.nazwa || ''))
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono miasta' })
  }
})
