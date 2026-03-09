/**
 * Usuwa pola alias O2M z kolekcji kosciol_katolicki w Directus.
 * Po usunięciu POST /items/kosciol_katolicki (bez zagnieżdżonych tablic) zwraca 201 i id.
 * Zapis O2M należy realizować dwufazowo (np. przez Nuxt POST /items/kosciol_katolicki).
 *
 * Uruchomienie: export DIRECTUS_URL=... DIRECTUS_TOKEN=... && node scripts/remove-o2m-alias-fields.js
 */
const DIRECTUS_URL = (process.env.DIRECTUS_URL || 'http://localhost:8056').replace(/\/$/, '')
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || ''
const COLLECTION = 'kosciol_katolicki'
const ALIAS_FIELDS = [
  'nabozenstwo',
  'duchowienstwo',
  'wydarzenie',
  'godziny_otwarcia_szczegoly',
  'cechy_obiektu',
  'certyfikat',
  'dodatkowa_wlasciwosc',
  'opinia',
  'relacje_przestrzenne',
]

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
  for (const field of ALIAS_FIELDS) {
    try {
      await api('DELETE', `/fields/${COLLECTION}/${field}`)
      console.log('  Usunięto pole:', field)
    } catch (err) {
      if (err.status === 404) console.log('  [pomijam] Brak pola:', field)
      else console.error('  [!]', field, err.message)
    }
  }
  console.log('Zakończono. POST /items/kosciol_katolicki (tylko pola główne) powinien zwracać 201.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
