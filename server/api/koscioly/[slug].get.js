/**
 * GET /api/koscioly/:slug – kościół z Directus (kosciol_katolicki) po slug.
 */
import { createDirectusClient } from '#config/AuthService.js'

const COLLECTION = 'kosciol_katolicki'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Brak slug' })
  }

  const config = useRuntimeConfig()
  const directus = createDirectusClient({
    url: config.directus?.url || 'http://localhost:8056',
    token: config.directus?.token,
  })

  const fields = [
    '*',
    'adres_id.*',
    'organizacja_id.*',
    'ocenaZbiorcza_id.*',
    'dekanat_id.*',
    'dekanat_id.archidiecezja_id.*',
    'logo.*',
    'obraz.*',
    'zdjecie.*',
  ].join(',')

  try {
    const res = await directus.get(`/items/${COLLECTION}`, {
      params: {
        'filter[slug][_eq]': slug,
        limit: 1,
        fields,
      },
    })
    const data = res?.data ?? res
    const list = Array.isArray(data) ? data : (data?.data ?? [])
    const church = list[0] ?? null
    if (!church) {
      throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono kościoła' })
    }

    try {
      const naboRes = await directus.get('/items/nabozenstwo', {
        params: {
          'filter[kosciol_id][_eq]': church.id,
          fields: 'id,nazwa,dzienTygodnia,godzina,uwagi',
          sort: 'nazwa,dzienTygodnia',
        },
      })
      const naboData = naboRes?.data ?? naboRes
      church.nabozenstwa = Array.isArray(naboData) ? naboData : (naboData?.data ?? [])
    } catch {
      church.nabozenstwa = []
    }
    try {
      const duchRes = await directus.get('/items/duchowienstwo', {
        params: {
          'filter[kosciol_id][_eq]': church.id,
          fields: 'id,tytul,imie,nazwisko,rola,dodatkowo,kontakt,dyzurKonfesjonal',
          sort: 'nazwisko,imie',
        },
      })
      const duchData = duchRes?.data ?? duchRes
      church.duchowienstwo = Array.isArray(duchData) ? duchData : (duchData?.data ?? [])
    } catch {
      church.duchowienstwo = []
    }

    return church
  } catch (err) {
    if (err.statusCode) throw err
    const msg = err.response?.data?.errors?.[0]?.message || err.message || 'Błąd Directus'
    throw createError({ statusCode: 500, statusMessage: msg })
  }
})
