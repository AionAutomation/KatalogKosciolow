/**
 * Test GEO: dwa kościoły z tą samą miejscowością (różna pisownia) – oczekiwany jeden rekord w miasto.
 * Wymaga: .env z DIRECTUS_URL, DIRECTUS_TOKEN.
 * Uruchomienie: node scripts/test-geo-relations.js
 */
import 'dotenv/config'
import { createDirectusClient } from '../config/AuthService.js'
import { upsertChurchData } from '../server/utils/upsert-dictionaries.js'

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

  const payload1 = {
    nazwa: 'Test GEO A ' + Date.now(),
    adres_id: {
      ulicaIBudynek: 'ul. Test 1',
      miejscowosc: 'Szczecin',
      kodPocztowy: '70-001',
      kraj: 'Polska',
    },
  }
  const payload2 = {
    nazwa: 'Test GEO B ' + Date.now(),
    adres_id: {
      ulicaIBudynek: 'ul. Inna 2',
      miejscowosc: '  SZCZECIN  ',
      kodPocztowy: '70-002',
      kraj: 'Polska',
    },
  }

  console.log('POST 1 (miejscowosc: Szczecin)...')
  const r1 = await upsertChurchData(directus, payload1)
  console.log('  kościół id:', r1?.id)

  console.log('POST 2 (miejscowosc: "  SZCZECIN  ")...')
  const r2 = await upsertChurchData(directus, payload2)
  console.log('  kościół id:', r2?.id)

  const raw = await directus.get('/items/miasto', { params: { limit: -1, fields: 'id,nazwa', filter: { nazwa: { _icontains: 'szczecin' } } } })
  const miasta = parseItems(raw)
  const szczecin = miasta.filter((m) => String(m.nazwa || '').toLowerCase().trim() === 'szczecin')

  console.log('Rekordy miasto zawierające "szczecin":', miasta.length)
  if (szczecin.length <= 1) {
    console.log('OK: brak duplikatu miasta dla tej samej znormalizowanej nazwy.')
  } else {
    console.log('UWAGA: oczekiwano co najwyżej jednego rekordu Szczecin, jest:', szczecin.length)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
