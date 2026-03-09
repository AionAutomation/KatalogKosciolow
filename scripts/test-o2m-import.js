/**
 * Test: czy zagnieżdżone O2M (nabozenstwo, duchowienstwo, wydarzenie, godziny_otwarcia_szczegoly)
 * są zapisywane przy POST /items/kosciol_katolicki.
 * Uruchomienie: node scripts/test-o2m-import.js
 * Lub: export DIRECTUS_URL=... DIRECTUS_TOKEN=... && node scripts/test-o2m-import.js
 *
 * Nie wymaga dotenv/axios – używa fetch() i zmiennych środowiskowych.
 */
const DIRECTUS_URL = (process.env.DIRECTUS_URL || 'http://localhost:8056').replace(/\/$/, '')
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || ''
const COLLECTION = 'kosciol_katolicki'

async function api(method, path, body = null) {
  const url = path.startsWith('http') ? path : `${DIRECTUS_URL}${path.startsWith('/') ? path : '/' + path}`
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {}),
    },
  }
  if (body != null && (method === 'POST' || method === 'PATCH')) opts.body = JSON.stringify(body)
  const res = await fetch(url, opts)
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const err = new Error(data?.errors?.[0]?.message || data?.message || res.statusText)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

async function main() {
  console.log('Directus URL:', DIRECTUS_URL)
  console.log('')

  // --- 1. GET /fields/kosciol_katolicki ---
  console.log('--- 1. GET /fields/kosciol_katolicki ---')
  let fieldsRaw
  try {
    fieldsRaw = await api('GET', `/fields/${COLLECTION}`)
  } catch (err) {
    console.error('Błąd GET fields:', err.status, err.data || err.message)
    process.exit(1)
  }

  const fields = Array.isArray(fieldsRaw) ? fieldsRaw : fieldsRaw?.data ?? []
  const allFieldNames = fields.map((f) => f.field)
  console.log('Wszystkie pola (nazwy):', allFieldNames.join(', '))
  const possibleO2M = ['nabozenstwo', 'duchowienstwo', 'wydarzenie', 'godziny_otwarcia_szczegoly', 'cechy_obiektu']
  console.log('')
  console.log('Pola O2M (sprawdzenie):')
  for (const name of possibleO2M) {
    const found = fields.find((f) => f.field === name)
    console.log(`  ${name}: ${found ? `TAK (type=${found.type}, interface=${found.meta?.interface || '-'})` : 'NIE ZNALEZIONO'}`)
  }
  console.log('')

  // --- 2. POST z zagnieżdżonymi danymi ---
  const payload = {
    nazwa: 'Test O2M ' + Date.now(),
    slug: 'test-o2m-' + Date.now(),
    nabozenstwo: [
      { nazwa: 'Msza św.', dzienTygodnia: 'Niedziela', godzina: '10:00' },
    ],
    duchowienstwo: [
      { tytul: 'ks.', imie: 'Jan', nazwisko: 'Kowalski', rola: 'Proboszcz' },
    ],
    wydarzenie: [
      { nazwa: 'Rekolekcje', dataRozpoczecia: '2025-04-01T10:00:00', dataZakonczenia: '2025-04-03T18:00:00' },
    ],
    godziny_otwarcia_szczegoly: [
      { dzienTygodnia: 'Monday', otwarcie: '08:00', zamkniecie: '18:00', czySpecjalne: false },
    ],
  }

  console.log('--- 2. POST /items/kosciol_katolicki (payload z O2M) ---')
  console.log('Payload keys:', Object.keys(payload))
  let created
  try {
    created = await api('POST', `/items/${COLLECTION}`, payload)
  } catch (err) {
    console.error('Błąd POST:', err.status, err.data || err.message)
    if (err.data?.errors) console.error('Szczegóły:', JSON.stringify(err.data.errors, null, 2))
    console.log('(Oczekiwane przy aliasach w Directus – przechodzę do testu dwufazowego.)')
  }

  const data = created?.data ?? created
  const item = Array.isArray(data) ? data[0] : data
  const churchId = item?.id
  if (churchId) {
    console.log('Utworzono kościół id:', churchId)
    console.log('W odpowiedzi POST (tablice O2M):')
    console.log('  nabozenstwo:', Array.isArray(item.nabozenstwo) ? item.nabozenstwo.length : item.nabozenstwo)
    console.log('  duchowienstwo:', Array.isArray(item.duchowienstwo) ? item.duchowienstwo.length : item.duchowienstwo)
    console.log('  wydarzenie:', Array.isArray(item.wydarzenie) ? item.wydarzenie.length : item.wydarzenie)
    console.log('  godziny_otwarcia_szczegoly:', Array.isArray(item.godziny_otwarcia_szczegoly) ? item.godziny_otwarcia_szczegoly.length : item.godziny_otwarcia_szczegoly)

    // --- 3. GET pojedynczego kościoła (pomijamy przy błędzie) ---
    console.log('')
    console.log('--- 3. GET /items/kosciol_katolicki/:id (z fields O2M) ---')
    const fieldsParam = 'id,nazwa,slug,nabozenstwo.id,nabozenstwo.nazwa,duchowienstwo.id,duchowienstwo.imie'
    try {
      const one = await api('GET', `/items/${COLLECTION}/${churchId}?fields=${encodeURIComponent(fieldsParam)}`)
      const oneData = one?.data ?? one
      console.log('nabozenstwo:', JSON.stringify(oneData?.nabozenstwo))
      console.log('duchowienstwo:', JSON.stringify(oneData?.duchowienstwo))
    } catch (err) {
      console.error('Błąd GET item:', err.status, err.data?.message || err.message)
    }

    // --- 4. GET z kolekcji potomnych ---
    console.log('')
    console.log('--- 4. GET /items/nabozenstwo?filter[kosciol_id][_eq]=... ---')
    try {
      const nabo = await api('GET', `/items/nabozenstwo?filter[kosciol_id][_eq]=${churchId}&limit=5`)
      const naboList = Array.isArray(nabo) ? nabo : nabo?.data ?? []
      console.log('Liczba nabozenstwo dla tego kościoła:', naboList.length)
      if (naboList.length > 0) console.log('Przykład:', JSON.stringify(naboList[0]))
    } catch (err) {
      console.error('Błąd GET nabozenstwo:', err.status, err.data || err.message)
    }
  } else {
    console.log('Brak id w odpowiedzi (np. błąd 500 przy aliasach).')
  }

  console.log('')
  console.log('--- Koniec testu ---')
  console.log('')
  console.log('--- Test dwufazowy (POST główny, potem O2M osobno) ---')
  const mainPayload = {
    nazwa: 'Test dwufazowy ' + Date.now(),
    slug: 'test-dwufazowy-' + Date.now(),
  }
  let created2
  try {
    created2 = await api('POST', `/items/${COLLECTION}`, mainPayload)
  } catch (err) {
    console.error('Błąd POST głównego:', err.message)
    process.exit(0)
  }
  const item2 = Array.isArray(created2) ? created2[0] : created2?.data ?? created2
  const id2 = item2?.id
  if (!id2) {
    console.log('Brak id po POST.')
    process.exit(0)
  }
  console.log('Utworzono kościół id:', id2)
  const o2mPayloads = {
    nabozenstwo: [{ nazwa: 'Msza', dzienTygodnia: 'Niedziela', godzina: '10:00', kosciol_id: id2 }],
    duchowienstwo: [{ tytul: 'ks.', imie: 'Jan', nazwisko: 'Test', rola: 'Proboszcz', kosciol_id: id2 }],
  }
  for (const [coll, rows] of Object.entries(o2mPayloads)) {
    for (const row of rows) {
      await api('POST', `/items/${coll}`, row)
    }
    console.log('  Zapisano', rows.length, 'rekord(ów) w', coll)
  }
  const naboCheck = await api('GET', `/items/nabozenstwo?filter[kosciol_id][_eq]=${id2}&limit=1`)
  const naboList2 = Array.isArray(naboCheck) ? naboCheck : naboCheck?.data ?? []
  console.log('Weryfikacja: nabozenstwo dla kościoła', id2, '=', naboList2.length > 0 ? 'OK' : 'BRAK')
  console.log('--- Koniec testu dwufazowego ---')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
