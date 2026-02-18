/**
 * Skrypt inicjalizacji schematu bazy Directus: kolekcja sk_koscioly.
 * Uruchomienie: node scripts/init-db.js (wymaga .env z DIRECTUS_URL i DIRECTUS_TOKEN)
 */
import 'dotenv/config'
import { createDirectusClient } from '../config/AuthService.js'

const COLLECTION = 'sk_koscioly'

const FIELDS = [
  { field: 'nazwa', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input', required: true } },
  { field: 'slug', type: 'string', schema: { is_nullable: false, unique: true }, meta: { interface: 'input', required: true } },
  { field: 'opis_seo', type: 'text', schema: {}, meta: { interface: 'input-multiline' } },
  { field: 'ludzie', type: 'json', schema: {}, meta: { interface: 'input-code' } },
  { field: 'styl_architektoniczny', type: 'string', schema: {}, meta: { interface: 'input' } },
  { field: 'adres_full', type: 'string', schema: {}, meta: { interface: 'input' } },
  { field: 'metadata', type: 'json', schema: {}, meta: { interface: 'input-code' } },
]

async function main() {
  const url = process.env.DIRECTUS_URL || 'http://localhost:8056'
  const token = process.env.DIRECTUS_TOKEN
  if (!token) {
    console.error('Brak DIRECTUS_TOKEN w .env')
    process.exit(1)
  }

  const directus = createDirectusClient({ url, token })

  try {
    const collections = await directus.get('/collections').catch(() => null)
    const list = Array.isArray(collections) ? collections : (collections?.data ?? [])
    const existing = list.find(c => c.collection === COLLECTION)
    if (existing) {
      console.log(`Kolekcja "${COLLECTION}" już istnieje.`)
      const fieldsRes = await directus.get(`/fields/${COLLECTION}`).catch(() => [])
      const fields = Array.isArray(fieldsRes) ? fieldsRes : (fieldsRes?.data ?? [])
      const names = new Set((Array.isArray(fields) ? fields : []).map(f => f.field))
      for (const def of FIELDS) {
        if (names.has(def.field)) {
          console.log(`  Pole "${def.field}" już istnieje.`)
          continue
        }
        await directus.post(`/fields/${COLLECTION}`, def)
        console.log(`  Dodano pole: ${def.field}`)
      }
      return
    }

    await directus.post('/collections', {
      collection: COLLECTION,
      meta: { icon: 'church', note: 'Katalog kościołów – SEO' },
      schema: {},
    })
    console.log(`Utworzono kolekcję: ${COLLECTION}`)

    for (const def of FIELDS) {
      await directus.post(`/fields/${COLLECTION}`, def)
      console.log(`  Dodano pole: ${def.field}`)
    }
  } catch (err) {
    const msg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message
    console.error('Błąd Directus:', msg || err.response?.data || err)
    process.exit(1)
  }
}

main()
