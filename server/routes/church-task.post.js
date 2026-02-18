/**
 * Endpoint POST /church-task – odbiera dane z wtyczki Dify,
 * przetwarza (slug, walidacja, flaga aktywne) i zapisuje do Directus.
 * Odpowiedź: { success: true } lub { success: false, error: "opis" }.
 */
import { createDirectusClient } from '#config/AuthService.js'
import { processChurchTask } from '#processor'

const COLLECTION = 'sk_koscioly'

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    return { success: false, error: 'Metoda dozwolona: POST' }
  }

  const config = useRuntimeConfig()
  const { directus, botAccount } = config
  const botActive = botAccount?.active !== false

  let body
  try {
    body = await readBody(event)
  } catch {
    return { success: false, error: 'Nieprawidłowy body (oczekiwany JSON)' }
  }

  const directus = createDirectusClient({
    url: directus?.url || 'http://localhost:8056',
    token: directus?.token,
  })

  const slugExists = async (slug) => {
    try {
      const res = await directus.get(`/items/${COLLECTION}`, {
        params: { 'filter[slug][_eq]': slug, limit: 1 },
      })
      const data = res?.data ?? res
      const list = Array.isArray(data) ? data : (data?.data ?? [])
      return list.length > 0
    } catch {
      return false
    }
  }

  const result = await processChurchTask(body, { botActive, slugExists })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  try {
    await directus.post(`/items/${COLLECTION}`, result.record)
    return { success: true }
  } catch (err) {
    const msg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message || 'Błąd zapisu do Directus'
    return { success: false, error: String(msg) }
  }
})
