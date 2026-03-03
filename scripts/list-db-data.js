/**
 * Odczyt danych z Directus – liczba rekordów i przykładowe wpisy.
 * Uruchom: node scripts/list-db-data.js
 * Wymaga .env: DIRECTUS_URL, DIRECTUS_TOKEN
 */
import 'dotenv/config'
import { createDirectusClient } from '../config/AuthService.js'

const COLLECTIONS = [
  'adres_pocztowy',
  'organizacja',
  'ocena_zbiorcza',
  'kosciol_katolicki',
  'cechy_obiektu',
  'relacje_przestrzenne',
  'certyfikat',
  'dodatkowa_wlasciwosc',
  'opinia',
  'wydarzenie',
  'godziny_otwarcia_szczegoly',
  'directus_files',
]

async function main() {
  const url = process.env.DIRECTUS_URL
  const token = process.env.DIRECTUS_TOKEN
  if (!url || !token) {
    console.error('Brak DIRECTUS_URL lub DIRECTUS_TOKEN w .env')
    process.exit(1)
  }

  const directus = createDirectusClient({ url, token })
  console.log('Directus URL:', url)
  console.log('')

  for (const collection of COLLECTIONS) {
    try {
      const res = await directus.get(`/items/${collection}`, {
        params: { limit: -1 },
      })
      const data = res?.data ?? res
      const items = Array.isArray(data) ? data : []
      const count = items.length
      console.log(`### ${collection}: ${count} rekordów`)
      if (count > 0 && count <= 5) {
        items.forEach((item, i) => console.log(`  [${i + 1}]`, JSON.stringify(item)))
      } else if (count > 5) {
        items.slice(0, 2).forEach((item, i) => console.log(`  [${i + 1}]`, JSON.stringify(item)))
        console.log(`  ... i ${count - 2} więcej`)
      }
      console.log('')
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.message || err.message
      console.log(`### ${collection}: BŁĄD – ${msg}\n`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
