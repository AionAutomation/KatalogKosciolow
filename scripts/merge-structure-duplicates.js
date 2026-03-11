/**
 * Merge duplikatów archidiecezja i dekanat na podstawie raportu z analyze-structure-duplicates.js.
 * Dla każdej grupy: aktualizuje wszystkie odwołania (dekanat.archidiecezja_id, kosciol_katolicki.dekanat_id)
 * na kanoniczny ID, potem usuwa zduplikowane rekordy (oprócz kanonicznego).
 *
 * Wymaga: scripts/geo-duplicates-report.json (wygenerowany przez analyze-structure-duplicates.js).
 * Wymaga: .env z DIRECTUS_URL, DIRECTUS_TOKEN.
 * Uruchomienie: node scripts/merge-structure-duplicates.js
 * Zalecane: backup bazy przed uruchomieniem.
 */
import 'dotenv/config'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createDirectusClient } from '../config/AuthService.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const url = process.env.DIRECTUS_URL || 'http://localhost:8056'
  const token = process.env.DIRECTUS_TOKEN
  if (!token) {
    console.error('Brak DIRECTUS_TOKEN w .env')
    process.exit(1)
  }

  const reportPath = join(__dirname, 'geo-duplicates-report.json')
  if (!existsSync(reportPath)) {
    console.error('Brak pliku scripts/geo-duplicates-report.json. Uruchom najpierw: node scripts/analyze-structure-duplicates.js')
    process.exit(1)
  }

  const report = JSON.parse(readFileSync(reportPath, 'utf8'))
  const directus = createDirectusClient({ url, token })
  console.log('Directus URL:', url)

  let archUpdated = 0
  let archDeleted = 0
  for (const g of report.archidiecezja?.groups ?? []) {
    const { canonicalId, ids } = g
    const toRemove = ids.filter((id) => id !== canonicalId)
    for (const id of toRemove) {
      const dekanatyRes = await directus.get('/items/dekanat', { params: { filter: { archidiecezja_id: { _eq: id } }, fields: 'id', limit: -1 } })
      const dekanaty = Array.isArray(dekanatyRes) ? dekanatyRes : (dekanatyRes?.data ?? [])
      for (const d of dekanaty) {
        await directus.patch(`/items/dekanat/${d.id}`, { archidiecezja_id: canonicalId })
        archUpdated++
      }
      await directus.delete(`/items/archidiecezja/${id}`)
      archDeleted++
    }
  }
  console.log('Archidiecezja: zaktualizowano odwołań w dekanat:', archUpdated, ', usunięto duplikatów:', archDeleted)

  let dekUpdated = 0
  let dekDeleted = 0
  for (const g of report.dekanat?.groups ?? []) {
    const { canonicalId, ids } = g
    const toRemove = ids.filter((id) => id !== canonicalId)
    for (const id of toRemove) {
      const kosciolyRes = await directus.get('/items/kosciol_katolicki', { params: { filter: { dekanat_id: { _eq: id } }, fields: 'id', limit: -1 } })
      const koscioly = Array.isArray(kosciolyRes) ? kosciolyRes : (kosciolyRes?.data ?? [])
      for (const k of koscioly) {
        await directus.patch(`/items/kosciol_katolicki/${k.id}`, { dekanat_id: canonicalId })
        dekUpdated++
      }
      await directus.delete(`/items/dekanat/${id}`)
      dekDeleted++
    }
  }
  console.log('Dekanat: zaktualizowano odwołań w kosciol_katolicki:', dekUpdated, ', usunięto duplikatów:', dekDeleted)
  console.log('Zakończono.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
