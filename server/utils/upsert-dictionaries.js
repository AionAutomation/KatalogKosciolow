/**
 * Upsert słowników (region, miasto, archidiecezja, dekanat, adres, organizacja, ocena_zbiorcza)
 * z normalizacją i fuzzy match – używane przy imporcie kościoła przez POST /items/kosciol_katolicki.
 *
 * JEDYNE MIEJSCE logiki getOrCreate* dla słowników GEO i powiązanych (region, miasto, archidiecezja,
 * dekanat, adres_pocztowy, organizacja, ocena_zbiorcza). Wszystkie nowe zapisy do tych kolekcji
 * powinny przechodzić przez funkcje z tego modułu, aby zachować deduplikację i spójność.
 * Zob. docs/geo-audit.md.
 */
import { slugify, parseItems } from './directus.js'
import { transformPayload, splitPayloadForO2M } from './import-kosciol.js'

/**
 * Normalizuje nazwę do porównań: trim, toLowerCase, usuwa prefiksy wg typu.
 * Nie zapisujemy tej wartości w DB – w bazie zostaje oryginalna nazwa (po trim).
 * @param {string} name
 * @param {string} type - 'region' | 'miasto' | 'archidiecezja' | 'dekanat' | 'organizacja'
 * @returns {string}
 */
export function standardizeName(name, type) {
  if (name == null || typeof name !== 'string') return ''
  let s = name.trim().toLowerCase()
  if (!s) return ''
  if (type === 'archidiecezja') {
    s = s.replace(/^archidiecezja\s+/i, '').trim()
  } else if (type === 'dekanat') {
    s = s.replace(/^dekanat\s+/i, '').trim()
  }
  return s
}

/**
 * @param {object} directus - klient Directus
 * @param {string} nazwa - nazwa regionu (po trim używana do zapisu)
 * @returns {Promise<number|null>}
 */
export async function getOrCreateRegion(directus, nazwa) {
  const trimmed = nazwa != null ? String(nazwa).trim() : ''
  if (!trimmed) return null
  const key = standardizeName(trimmed, 'region')
  const list = parseItems(await directus.get('/items/region', { params: { limit: -1, fields: 'id,nazwa' } }))
  const found = list.find((r) => standardizeName(r.nazwa, 'region') === key)
  if (found) return found.id
  const created = await directus.post('/items/region', {
    nazwa: trimmed,
    slug: slugify(trimmed) || trimmed.toLowerCase().replace(/\s+/g, '-'),
  })
  const data = created?.data ?? created
  return data?.id ?? null
}

/**
 * @param {object} directus
 * @param {string} nazwa
 * @returns {Promise<number|null>}
 */
export async function getOrCreateArchidiecezja(directus, nazwa) {
  const trimmed = nazwa != null ? String(nazwa).trim() : ''
  if (!trimmed) return null
  const key = standardizeName(trimmed, 'archidiecezja')
  const list = parseItems(await directus.get('/items/archidiecezja', { params: { limit: -1, fields: 'id,nazwa' } }))
  const found = list.find((r) => standardizeName(r.nazwa, 'archidiecezja') === key)
  if (found) return found.id
  const created = await directus.post('/items/archidiecezja', { nazwa: trimmed })
  const data = created?.data ?? created
  return data?.id ?? null
}

/**
 * @param {object} directus
 * @param {string} nazwa
 * @param {number|null} region_id
 * @returns {Promise<number|null>}
 */
export async function getOrCreateMiasto(directus, nazwa, region_id) {
  const trimmed = nazwa != null ? String(nazwa).trim() : ''
  if (!trimmed) return null
  const key = standardizeName(trimmed, 'miasto')
  const list = parseItems(await directus.get('/items/miasto', { params: { limit: -1, fields: 'id,nazwa,region_id' } }))
  const found = list.find(
    (r) => standardizeName(r.nazwa, 'miasto') === key && (region_id == null || r.region_id === region_id)
  )
  if (found) return found.id
  const created = await directus.post('/items/miasto', {
    nazwa: trimmed,
    slug: slugify(trimmed) || trimmed.toLowerCase().replace(/\s+/g, '-'),
    region_id: region_id ?? null,
  })
  const data = created?.data ?? created
  return data?.id ?? null
}

/**
 * @param {object} directus
 * @param {string} nazwa
 * @param {number|null} archidiecezja_id
 * @returns {Promise<number|null>}
 */
export async function getOrCreateDekanat(directus, nazwa, archidiecezja_id) {
  const trimmed = nazwa != null ? String(nazwa).trim() : ''
  if (!trimmed) return null
  const key = standardizeName(trimmed, 'dekanat')
  const list = parseItems(await directus.get('/items/dekanat', { params: { limit: -1, fields: 'id,nazwa,archidiecezja_id' } }))
  const found = list.find(
    (r) =>
      standardizeName(r.nazwa, 'dekanat') === key &&
      (archidiecezja_id == null || r.archidiecezja_id === archidiecezja_id)
  )
  if (found) return found.id
  const created = await directus.post('/items/dekanat', {
    nazwa: trimmed,
    archidiecezja_id: archidiecezja_id ?? null,
  })
  const data = created?.data ?? created
  return data?.id ?? null
}

/**
 * @param {object} directus
 * @param {{ ulicaIBudynek?: string, miejscowosc?: string, kodPocztowy?: string, kraj?: string, miasto_id?: number|null }} fields
 * @returns {Promise<number|null>}
 */
export async function getOrCreateAdres(directus, fields) {
  const { ulicaIBudynek, miejscowosc, kodPocztowy, kraj, miasto_id } = fields || {}
  const list = parseItems(
    await directus.get('/items/adres_pocztowy', {
      params: { limit: -1, fields: 'id,ulicaIBudynek,miejscowosc,kodPocztowy,kraj,miasto_id' },
    })
  )
  const u = (v) => (v != null ? String(v).trim() : '')
  const found = list.find(
    (r) =>
      u(r.ulicaIBudynek) === u(ulicaIBudynek) &&
      u(r.miejscowosc) === u(miejscowosc) &&
      u(r.kodPocztowy) === u(kodPocztowy) &&
      (miasto_id == null || r.miasto_id === miasto_id)
  )
  if (found) return found.id
  const created = await directus.post('/items/adres_pocztowy', {
    ulicaIBudynek: u(ulicaIBudynek) || null,
    miejscowosc: u(miejscowosc) || null,
    kodPocztowy: u(kodPocztowy) || null,
    kraj: u(kraj) || null,
    miasto_id: miasto_id ?? null,
  })
  const data = created?.data ?? created
  return data?.id ?? null
}

/**
 * @param {object} directus
 * @param {{ nazwa: string, typ?: string, telefon?: string, stronaWww?: string }} fields
 * @returns {Promise<number|null>}
 */
export async function getOrCreateOrganizacja(directus, fields) {
  const nazwa = fields?.nazwa != null ? String(fields.nazwa).trim() : ''
  if (!nazwa) return null
  const key = standardizeName(nazwa, 'organizacja')
  const list = parseItems(await directus.get('/items/organizacja', { params: { limit: -1, fields: 'id,nazwa' } }))
  const found = list.find((r) => standardizeName(r.nazwa, 'organizacja') === key)
  if (found) return found.id
  const created = await directus.post('/items/organizacja', {
    nazwa,
    typ: fields?.typ != null ? String(fields.typ).trim() : null,
    telefon: fields?.telefon != null ? String(fields.telefon).trim() : null,
    stronaWww: fields?.stronaWww != null ? String(fields.stronaWww).trim() : null,
  })
  const data = created?.data ?? created
  return data?.id ?? null
}

/**
 * @param {object} directus
 * @param {{ sredniaOcena?: number, liczbaOpinii?: number }} fields
 * @returns {Promise<number|null>}
 */
export async function getOrCreateOcenaZbiorcza(directus, fields) {
  const srednia = fields?.sredniaOcena ?? 0
  const liczba = fields?.liczbaOpinii ?? 0
  const list = parseItems(
    await directus.get('/items/ocena_zbiorcza', { params: { limit: -1, fields: 'id,sredniaOcena,liczbaOpinii' } })
  )
  const found = list.find((r) => r.sredniaOcena === srednia && r.liczbaOpinii === liczba)
  if (found) return found.id
  const created = await directus.post('/items/ocena_zbiorcza', { sredniaOcena: srednia, liczbaOpinii: liczba })
  const data = created?.data ?? created
  return data?.id ?? null
}

/**
 * Rozwiązuje słowniki z data i zwraca obiekt z ID (do wstrzyknięcia do body przed transformPayload).
 * Kolejność: region → archidiecezja → miasto (region_id) → dekanat (archidiecezja_id) → adres (miasto_id) → organizacja → ocena_zbiorcza.
 * @param {object} directus
 * @param {object} data - surowy body POST
 * @returns {Promise<{ adres_id: number|null, organizacja_id: number|null, dekanat_id: number|null, ocenaZbiorcza_id: number|null }>}
 */
async function resolveDictionaries(directus, data) {
  const regionNazwa = data.region?.nazwa ?? data.adres_id?.region ?? data.miasto?.region ?? null
  const miastoNazwa = data.miasto?.nazwa ?? data.adres_id?.miejscowosc ?? null
  const archidiecezjaNazwa = data.dekanat_id?.archidiecezja_id?.nazwa ?? null
  const dekanatNazwa = data.dekanat_id?.nazwa ?? null
  const adresFields = data.adres_id && typeof data.adres_id === 'object' ? data.adres_id : null
  const organizacjaFields = data.organizacja_id && typeof data.organizacja_id === 'object' ? data.organizacja_id : null
  const ocenaFields = data.ocenaZbiorcza_id && typeof data.ocenaZbiorcza_id === 'object' ? data.ocenaZbiorcza_id : null

  const regionId = await getOrCreateRegion(directus, regionNazwa)
  const archidiecezjaId = await getOrCreateArchidiecezja(directus, archidiecezjaNazwa)
  const miastoId = await getOrCreateMiasto(directus, miastoNazwa, regionId)
  const dekanatId = await getOrCreateDekanat(directus, dekanatNazwa, archidiecezjaId)
  const adresId =
    adresFields && (adresFields.ulicaIBudynek ?? adresFields.miejscowosc ?? adresFields.kodPocztowy ?? adresFields.kraj)
      ? await getOrCreateAdres(directus, { ...adresFields, miasto_id: miastoId })
      : null
  const organizacjaId = organizacjaFields?.nazwa ? await getOrCreateOrganizacja(directus, organizacjaFields) : null
  const ocenaId =
    ocenaFields && (ocenaFields.sredniaOcena != null || ocenaFields.liczbaOpinii != null)
      ? await getOrCreateOcenaZbiorcza(directus, ocenaFields)
      : null

  return {
    adres_id: adresId,
    organizacja_id: organizacjaId,
    dekanat_id: dekanatId,
    ocenaZbiorcza_id: ocenaId,
  }
}

/**
 * Rozwiązuje tylko region i miasto z payloadu (np. do backfillu adresów lub innych przepływów).
 * Źródła: data.region?.nazwa, data.adres_id?.region, data.miasto?.region; data.miasto?.nazwa, data.adres_id?.miejscowosc.
 * @param {object} directus
 * @param {{ region?: { nazwa?: string }, adres_id?: { region?: string, miejscowosc?: string }, miasto?: { nazwa?: string, region?: string } }} data
 * @returns {Promise<{ regionId: number|null, miastoId: number|null }>}
 */
export async function resolveRegionAndCityFromAddress(directus, data) {
  const regionNazwa = data?.region?.nazwa ?? data?.adres_id?.region ?? data?.miasto?.region ?? null
  const miastoNazwa = data?.miasto?.nazwa ?? data?.adres_id?.miejscowosc ?? null
  const regionId = await getOrCreateRegion(directus, regionNazwa)
  const miastoId = await getOrCreateMiasto(directus, miastoNazwa, regionId)
  return { regionId, miastoId }
}

const COLLECTION = 'kosciol_katolicki'

/**
 * Upsert kościoła: rozwiązuje słowniki (get-or-create z normalizacją), buduje payload z ID,
 * zapisuje kościół i rekordy O2M. Jedno wywołanie dla jednego POST /items/kosciol_katolicki.
 * @param {object} directus - klient Directus
 * @param {object} data - surowy body (nazwa wymagane, adres_id, organizacja_id, dekanat_id, O2M tablice, itd.)
 * @returns {Promise<object>} - { id, ...item } jak obecny handler
 */
export async function upsertChurchData(directus, data) {
  const resolved = await resolveDictionaries(directus, data)
  const resolvedBody = {
    ...data,
    adres_id: resolved.adres_id,
    organizacja_id: resolved.organizacja_id,
    dekanat_id: resolved.dekanat_id,
    ocenaZbiorcza_id: resolved.ocenaZbiorcza_id,
  }
  const fullPayload = transformPayload(resolvedBody)
  const { mainPayload, o2mItems } = splitPayloadForO2M(fullPayload)

  const res = await directus.post(`/items/${COLLECTION}`, mainPayload)
  const resData = res?.data ?? res
  const item = Array.isArray(resData) ? resData[0] : resData
  const churchId = item?.id
  if (!churchId) return resData

  for (const [key, rows] of Object.entries(o2mItems)) {
    for (const row of rows) {
      await directus.post(`/items/${key}`, { ...row, kosciol_id: churchId })
    }
  }

  return { ...item, id: churchId }
}
