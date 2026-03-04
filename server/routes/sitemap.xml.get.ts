/**
 * GET /sitemap.xml – dynamiczna sitemap (kościoły, miasta, regiony, kategorie, blog).
 */
import { createDirectusClient } from '#config/AuthService.js'

function parseItems(res: unknown) {
  const data = (res as { data?: unknown[] })?.data ?? res
  return Array.isArray(data) ? data : ((data as { data?: unknown[] })?.data ?? [])
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseUrl = (config.public as { siteUrl?: string })?.siteUrl || (event.node.req?.headers?.host ? `http://${event.node.req.headers.host}` : 'https://example.com')

  const directus = createDirectusClient({
    url: config.directus?.url || 'http://localhost:8056',
    token: config.directus?.token,
  })

  const urls: string[] = ['/', '/koscioly', '/miasta', '/regiony', '/kategorie', '/blog', '/o-projekcie', '/kontakt', '/polityka-prywatnosci']

  try {
    const [koscioly, miasta, regiony, kategorie, blog] = await Promise.all([
      directus.get('/items/kosciol_katolicki', { params: { fields: 'slug', limit: -1 } }).catch(() => []),
      directus.get('/items/miasto', { params: { fields: 'slug', limit: -1 } }).catch(() => []),
      directus.get('/items/region', { params: { fields: 'slug', limit: -1 } }).catch(() => []),
      directus.get('/items/kategoria', { params: { fields: 'slug', limit: -1 } }).catch(() => []),
      directus.get('/items/blog_post', { params: { fields: 'slug', limit: -1 } }).catch(() => []),
    ])

    for (const i of parseItems(koscioly) as { slug?: string }[]) {
      if (i.slug) urls.push(`/koscioly/${i.slug}`)
    }
    for (const i of parseItems(miasta) as { slug?: string }[]) {
      if (i.slug) urls.push(`/miasta/${i.slug}`)
    }
    for (const i of parseItems(regiony) as { slug?: string }[]) {
      if (i.slug) urls.push(`/regiony/${i.slug}`)
    }
    for (const i of parseItems(kategorie) as { slug?: string }[]) {
      if (i.slug) urls.push(`/kategorie/${i.slug}`)
    }
    for (const i of parseItems(blog) as { slug?: string }[]) {
      if (i.slug) urls.push(`/blog/${i.slug}`)
    }
  } catch {
    // Fallback – tylko strony statyczne
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${baseUrl.replace(/\/$/, '')}${path}</loc></url>`).join('\n')}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml')
  return xml
})
