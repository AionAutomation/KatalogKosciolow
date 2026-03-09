/**
 * Ustawia aliasy O2M (field_one) w relacjach Directus, żeby kolekcja kosciol_katolicki
 * miała pola nabozenstwo, duchowienstwo, wydarzenie, godziny_otwarcia_szczegoly (i opcjonalnie inne).
 * Dzięki temu POST /items/kosciol_katolicki z zagnieżdżonymi tablicami zapisze je do bazy.
 *
 * Uruchomienie: export DIRECTUS_URL=... DIRECTUS_TOKEN=... && node scripts/fix-o2m-aliases.js
 */
const DIRECTUS_URL = (process.env.DIRECTUS_URL || 'http://localhost:8056').replace(/\/$/, '')
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || ''

const O2M_ALIASES = [
  ['nabozenstwo', 'kosciol_katolicki', 'kosciol_id', 'nabozenstwo'],
  ['duchowienstwo', 'kosciol_katolicki', 'kosciol_id', 'duchowienstwo'],
  ['wydarzenie', 'kosciol_katolicki', 'kosciol_id', 'wydarzenie'],
  ['godziny_otwarcia_szczegoly', 'kosciol_katolicki', 'kosciol_id', 'godziny_otwarcia_szczegoly'],
  ['cechy_obiektu', 'kosciol_katolicki', 'kosciol_id', 'cechy_obiektu'],
  ['certyfikat', 'kosciol_katolicki', 'kosciol_id', 'certyfikat'],
  ['dodatkowa_wlasciwosc', 'kosciol_katolicki', 'kosciol_id', 'dodatkowa_wlasciwosc'],
  ['opinia', 'kosciol_katolicki', 'kosciol_id', 'opinia'],
  ['relacje_przestrzenne', 'kosciol_katolicki', 'kosciol_id', 'relacje_przestrzenne'],
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

function relationMatches(r, manyCol, oneCol, fieldMany) {
  const many = r.many_collection ?? r.collection
  const one = r.one_collection ?? r.related_collection
  const field = r.many_field ?? r.field
  return many === manyCol && one === oneCol && field === fieldMany
}

async function main() {
  console.log('Directus URL:', DIRECTUS_URL)
  console.log('Pobieranie listy relacji...')
  const raw = await api('GET', '/relations?fields=*')
  const relations = Array.isArray(raw) ? raw : raw?.data ?? []
  console.log('Liczba relacji:', relations.length)

  for (const [manyCol, oneCol, fieldMany, aliasName] of O2M_ALIASES) {
    const r = relations.find((rel) => relationMatches(rel, manyCol, oneCol, fieldMany))
    if (!r) {
      console.log(`  [pomijam] Brak relacji ${manyCol}.${fieldMany} -> ${oneCol}`)
      continue
    }
    const id = r.meta?.id ?? r.id
    if (!id) {
      console.log(`  [!] Relacja ${manyCol}.${fieldMany} -> ${oneCol} bez id (format: ${JSON.stringify(Object.keys(r))})`)
      continue
    }
    const currentOneField = r.meta?.one_field ?? r.one_field ?? null
    if (currentOneField === aliasName) {
      console.log(`  [OK] ${aliasName} – alias już ustawiony`)
      continue
    }
    try {
      await api('PATCH', `/relations/${manyCol}/${fieldMany}`, { field_one: aliasName })
      console.log(`  [+] ${aliasName} – ustawiono field_one`)
    } catch (err) {
      const reason = err.data?.errors?.[0]?.extensions?.reason ?? err.data?.errors?.[0]?.reason ?? ''
      const msg = err.data?.errors?.[0]?.message ?? ''
      const payloadErr = String(reason).includes('field_one') || String(msg).includes('field_one')
      if (payloadErr || err.status === 404) {
        console.log(`  [i] ${aliasName}: PATCH relations niedostępny – dodaję pole alias przez POST /fields...`)
        try {
          await api('POST', `/fields/${oneCol}`, {
            field: aliasName,
            type: 'alias',
            schema: null,
            meta: {
              interface: 'list-o2m',
              special: ['o2m'],
              options: {
                template: '{{nazwa}}',
                related_collection: manyCol,
                relation_type: 'many',
              },
            },
          })
          console.log(`  [+] ${aliasName} – utworzono pole alias (list-o2m)`)
        } catch (err2) {
          console.error(`  [!] ${aliasName} POST fields:`, err2.message, err2.data ? JSON.stringify(err2.data) : '')
        }
      } else {
        console.error(`  [!] ${aliasName}:`, err.message, err.data ? JSON.stringify(err.data) : '')
      }
    }
  }

  console.log('')
  console.log('Zakończono. Uruchom ponownie scripts/test-o2m-import.js, żeby zweryfikować.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
