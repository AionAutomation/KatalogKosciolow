/**
 * GET /api/miasta – lista miast z Directus lub agregacja z adresów kościołów (fallback).
 */
import { createDirectusClient } from '#config/AuthService.js'
import { parseItems, slugify } from '../../utils/directus.js'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const directus = createDirectusClient({
    url: config.directus?.url || 'http://localhost:8056',
    token: config.directus?.token,
  })

  try {
    const res = await directus.get('/items/miasto', {
      params: { fields: 'id,slug,nazwa,region_id', limit: -1, sort: 'nazwa' },
    })
    const items = parseItems(res)
    if (items.length > 0) return items
  } catch {
    // Kolekcja miasto nie istnieje lub błąd – fallback
  }

  try {
    const res = await directus.get('/items/kosciol_katolicki', {
      params: { fields: 'adres_id.miejscowosc', limit: -1 },
    })
    const koscioly = parseItems(res)
    const seen = new Set()
    const miasta = []
    for (const k of koscioly) {
      const m = k.adres_id?.miejscowosc || k.adres_id
      const nazwa = typeof m === 'string' ? m : (m?.miejscowosc || '')
      if (nazwa && !seen.has(nazwa.toLowerCase())) {
        seen.add(nazwa.toLowerCase())
        const slug = slugify(nazwa) || 'miasto'
        miasta.push({ id: slug, slug, nazwa: nazwa.trim() })
      }
    }
    return miasta.sort((a, b) => a.nazwa.localeCompare(b.nazwa))
  } catch {
    return []
  }
})
