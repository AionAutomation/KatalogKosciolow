/**
 * Uzupełnia pole slug w istniejących rekordach kosciol_katolicki (gdy kolumna była dodana jako nullable).
 * Generuje slug z nazwa, gwarantuje unikalność. Na końcu ustawia pole slug jako wymagane (NOT NULL).
 *
 * Uruchom po init-db gdy tabela już miała dane:
 *   node scripts/fill-slug-existing.js
 *
 * Wymaga .env: DIRECTUS_URL, DIRECTUS_TOKEN
 */
import 'dotenv/config'
import { createDirectusClient } from '../config/AuthService.js'
import { slugify } from '../lib/slugify.js'

const COLLECTION = 'kosciol_katolicki'

async function main() {
  const url = process.env.DIRECTUS_URL || 'http://localhost:8056'
  const token = process.env.DIRECTUS_TOKEN
  if (!token) {
    console.error('Brak DIRECTUS_TOKEN w .env')
    process.exit(1)
  }

  const directus = createDirectusClient({ url, token })
  console.log('Directus URL:', url)
  console.log('Pobieranie rekordów bez slug…\n')

  const res = await directus.get(`/items/${COLLECTION}`, {
    params: { fields: 'id,nazwa,slug', limit: -1 },
  })
  const data = res?.data ?? res
  const items = Array.isArray(data) ? data : (data?.data ?? [])

  const needSlug = items.filter((i) => !i.slug || !String(i.slug).trim())
  if (needSlug.length === 0) {
    console.log('Wszystkie rekordy mają już slug.')
    const withSlug = items.filter((i) => i.slug)
    if (withSlug.length > 0) {
      await setSlugRequired(directus)
    }
    return
  }

  const existingSlugs = new Set(items.map((i) => (i.slug || '').trim().toLowerCase()).filter(Boolean))

  for (const item of needSlug) {
    const base = slugify(item.nazwa || 'kosciol') || 'kosciol'
    let slug = base
    let n = 0
    while (existingSlugs.has(slug.toLowerCase())) {
      n += 1
      slug = `${base}-${n}`
    }
    existingSlugs.add(slug.toLowerCase())

    try {
      await directus.patch(`/items/${COLLECTION}/${item.id}`, { slug })
      console.log(`  [OK] id=${item.id}  "${(item.nazwa || '').slice(0, 40)}..." → ${slug}`)
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.message || err.message
      console.error(`  [ERR] id=${item.id}: ${msg}`)
    }
  }

  await setSlugRequired(directus)
  console.log('\nGotowe.')
}

async function setSlugRequired(directus) {
  console.log('\nUstawianie pola slug jako wymagane (NOT NULL)…')
  try {
    await directus.patch(`/fields/${COLLECTION}/slug`, {
      schema: { is_nullable: false },
    })
    console.log('  [OK] Pole slug jest teraz wymagane.')
  } catch (err) {
    const msg = err.response?.data?.errors?.[0]?.message || err.message
    console.warn('  [!] Nie udało się ustawić wymagane:', msg)
    console.warn('      W Directus: Ustawienia → Model danych → kosciol_katolicki → slug → wyłącz "Nullable".')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
