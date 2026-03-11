/**
 * Poprawia w bazie wszystkie nazwy archidiecezji i dekanatów: trim oraz usuwa prefiksy
 * "Archidiecezja " i "Dekanat ". Po uruchomieniu możesz odpalić analyze-structure-duplicates.js
 * i merge-structure-duplicates.js, aby zmergować ewentualne duplikaty.
 *
 * Wymaga: .env z DIRECTUS_URL, DIRECTUS_TOKEN.
 * Uruchomienie: node scripts/normalize-names-archidiecezja-dekanat.js
 */
import 'dotenv/config'
import { createDirectusClient } from '../config/AuthService.js'

function parseItems(res) {
  const data = res?.data ?? res
  return Array.isArray(data) ? data : (data?.data ?? [])
}

/** Nazwa do zapisu w DB: trim + usunięcie prefiksu (bez zmiany wielkości liter). */
function canonicalArchidiecezjaNazwa(nazwa) {
  if (nazwa == null || typeof nazwa !== 'string') return ''
  return nazwa.trim().replace(/^Archidiecezja\s+/i, '').trim()
}

function canonicalDekanatNazwa(nazwa) {
  if (nazwa == null || typeof nazwa !== 'string') return ''
  return nazwa.trim().replace(/^Dekanat\s+/i, '').trim()
}

async function main() {
  const url = process.env.DIRECTUS_URL || 'http://localhost:8056'
  const token = process.env.DIRECTUS_TOKEN
  if (!token) {
    console.error('Brak DIRECTUS_TOKEN w .env')
    process.exit(1)
  }

  const directus = createDirectusClient({ url, token })
  console.log('Directus URL:', url)

  const archRaw = await directus.get('/items/archidiecezja', { params: { limit: -1, fields: 'id,nazwa' } })
  const dekRaw = await directus.get('/items/dekanat', { params: { limit: -1, fields: 'id,nazwa' } })
  const archidiecezje = parseItems(archRaw)
  const dekanaty = parseItems(dekRaw)

  let archOk = 0
  let archUpdated = 0
  for (const r of archidiecezje) {
    const canonical = canonicalArchidiecezjaNazwa(r.nazwa)
    if (canonical === (r.nazwa || '').trim()) {
      archOk++
      continue
    }
    try {
      await directus.patch(`/items/archidiecezja/${r.id}`, { nazwa: canonical || r.nazwa?.trim() || '' })
      archUpdated++
      console.log(`  archidiecezja ${r.id}: "${r.nazwa}" → "${canonical}"`)
    } catch (err) {
      console.warn(`  [!] archidiecezja ${r.id}:`, err.response?.data?.message || err.message)
    }
  }
  console.log(`Archidiecezja: bez zmian ${archOk}, zaktualizowano ${archUpdated}`)

  let dekOk = 0
  let dekUpdated = 0
  for (const d of dekanaty) {
    const canonical = canonicalDekanatNazwa(d.nazwa)
    if (canonical === (d.nazwa || '').trim()) {
      dekOk++
      continue
    }
    try {
      await directus.patch(`/items/dekanat/${d.id}`, { nazwa: canonical || d.nazwa?.trim() || '' })
      dekUpdated++
      console.log(`  dekanat ${d.id}: "${d.nazwa}" → "${canonical}"`)
    } catch (err) {
      console.warn(`  [!] dekanat ${d.id}:`, err.response?.data?.message || err.message)
    }
  }
  console.log(`Dekanat: bez zmian ${dekOk}, zaktualizowano ${dekUpdated}`)
  console.log('Zakończono. W razie duplikatów uruchom: node scripts/analyze-structure-duplicates.js, potem node scripts/merge-structure-duplicates.js')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
