/**
 * Backfill miasto_id w adres_pocztowy na podstawie pola miejscowosc.
 * Dla każdego adresu z miasto_id=null i niepustym miejscowosc wywołuje getOrCreateMiasto
 * (z region_id=null, bo województwo nie jest przechowywane w adres_pocztowy) i ustawia miasto_id.
 *
 * Wymaga: .env z DIRECTUS_URL, DIRECTUS_TOKEN.
 * Uruchomienie: node scripts/backfill-miasto-for-adres.js
 */
import 'dotenv/config'
import { createDirectusClient } from '../config/AuthService.js'
import { getOrCreateMiasto } from '../server/utils/upsert-dictionaries.js'

function parseItems(res) {
  const data = res?.data ?? res
  return Array.isArray(data) ? data : (data?.data ?? [])
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
  console.log('Pobieranie adres_pocztowy...')

  const raw = await directus.get('/items/adres_pocztowy', {
    params: { limit: -1, fields: 'id,miejscowosc,miasto_id' },
  })
  const adresy = parseItems(raw)
  const doUzupelnienia = adresy.filter((a) => (a.miasto_id == null || a.miasto_id === '') && a.miejscowosc && String(a.miejscowosc).trim())

  console.log(`Adresów łącznie: ${adresy.length}, do uzupełnienia miasto_id: ${doUzupelnienia.length}`)

  let zaktualizowane = 0
  let bledy = 0
  for (const adres of doUzupelnienia) {
    const miejscowosc = String(adres.miejscowosc).trim()
    try {
      const miastoId = await getOrCreateMiasto(directus, miejscowosc, null)
      if (miastoId != null) {
        await directus.patch(`/items/adres_pocztowy/${adres.id}`, { miasto_id: miastoId })
        zaktualizowane++
        if (zaktualizowane % 50 === 0) console.log(`  zaktualizowano ${zaktualizowane}...`)
      }
    } catch (err) {
      bledy++
      console.warn(`  [!] adres ${adres.id} (${miejscowosc}):`, err.response?.data?.message || err.message)
    }
  }

  console.log(`Zakończono. Zaktualizowano: ${zaktualizowane}, błędów: ${bledy}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
