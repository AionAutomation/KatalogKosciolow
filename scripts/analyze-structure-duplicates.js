/**
 * Analiza duplikatów w archidiecezja i dekanat (po znormalizowanej nazwie).
 * Grupuje rekordy po standardizeName(nazwa, type) i wypisuje raport z proponowanymi mergami
 * (kanoniczny ID = pierwszy z grupy). Zapis raportu do scripts/geo-duplicates-report.json.
 *
 * Wymaga: .env z DIRECTUS_URL, DIRECTUS_TOKEN.
 * Uruchomienie: node scripts/analyze-structure-duplicates.js
 */
import 'dotenv/config'
import { writeFileSync } from 'node:fs'
import { createDirectusClient } from '../config/AuthService.js'
import { standardizeName } from '../server/utils/upsert-dictionaries.js'

function parseItems(res) {
  const data = res?.data ?? res
  return Array.isArray(data) ? data : (data?.data ?? [])
}

function groupByNormalized(items, type) {
  const groups = new Map()
  for (const r of items) {
    const key = standardizeName(r.nazwa ?? '', type)
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({ id: r.id, nazwa: r.nazwa })
  }
  return groups
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
  const dekRaw = await directus.get('/items/dekanat', { params: { limit: -1, fields: 'id,nazwa,archidiecezja_id' } })
  const archidiecezje = parseItems(archRaw)
  const dekanaty = parseItems(dekRaw)

  const archGroups = groupByNormalized(archidiecezje, 'archidiecezja')
  const archDuplicates = []
  for (const [key, list] of archGroups) {
    if (list.length > 1) {
      const canonicalId = list[0].id
      archDuplicates.push({ normalizedName: key, canonicalId, ids: list.map((r) => r.id), names: list.map((r) => r.nazwa) })
    }
  }

  const dekGroups = new Map()
  for (const d of dekanaty) {
    const key = `${standardizeName(d.nazwa ?? '', 'dekanat')}::${d.archidiecezja_id ?? 'null'}`
    if (!dekGroups.has(key)) dekGroups.set(key, [])
    dekGroups.get(key).push({ id: d.id, nazwa: d.nazwa, archidiecezja_id: d.archidiecezja_id })
  }
  const dekDuplicates = []
  for (const [key, list] of dekGroups) {
    if (list.length > 1) {
      const canonicalId = list[0].id
      dekDuplicates.push({ key, canonicalId, ids: list.map((r) => r.id), names: list.map((r) => r.nazwa) })
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    archidiecezja: { total: archidiecezje.length, duplicateGroups: archDuplicates.length, groups: archDuplicates },
    dekanat: { total: dekanaty.length, duplicateGroups: dekDuplicates.length, groups: dekDuplicates },
  }

  const outPath = new URL('geo-duplicates-report.json', import.meta.url)
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')
  console.log('Raport zapisany do scripts/geo-duplicates-report.json')
  console.log('Archidiecezje: duplikaty w', archDuplicates.length, 'grupach')
  console.log('Dekanaty: duplikaty w', dekDuplicates.length, 'grupach')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
