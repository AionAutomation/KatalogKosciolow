/**
 * Główna logika przetwarzania danych z Dify/Perplexity:
 * - walidacja wejścia
 * - generowanie unikalnego slug
 * - sprawdzenie flagi aktywne przed operacją
 * - przygotowanie rekordu do Directus
 */

/**
 * Slug z nazwy: małe litery, polskie znaki → ASCII, spacje → myślniki, usuwa zbędne znaki.
 * @param {string} name
 * @returns {string}
 */
export function slugify(name) {
  if (!name || typeof name !== 'string') return ''
  const map = {
    ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
    Ą: 'a', Ć: 'c', Ę: 'e', Ł: 'l', Ń: 'n', Ó: 'o', Ś: 's', Ź: 'z', Ż: 'z',
  }
  let s = name.trim().toLowerCase()
  s = s.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, c => map[c] ?? c)
  s = s.replace(/[^a-z0-9\s-]/g, '')
  s = s.replace(/\s+/g, '-').replace(/-+/g, '-')
  return s.replace(/^-|-$/g, '') || 'kosciol'
}

/**
 * Walidacja obiektu z Dify. Zwraca { valid: boolean, error?: string }.
 * @param {unknown} data
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateChurchPayload(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'Oczekiwano obiektu JSON' }
  }
  const d = /** @type {Record<string, unknown>} */ (data)
  if (!d.nazwa || typeof d.nazwa !== 'string' || !d.nazwa.trim()) {
    return { valid: false, error: 'Brak lub pusta nazwa kościoła' }
  }
  return { valid: true }
}

/**
 * Przygotowuje jeden rekord do zapisu w Directus (kolekcja sk_koscioly).
 * Generuje slug z nazwy; nie gwarantuje unikalności – to robi warstwa wyżej (np. dopisanie sufiksów).
 * @param {Record<string, unknown>} raw – surowe dane z Dify
 * @param {string} [baseSlug] – opcjonalny slug (np. już unikalny)
 */
export function toChurchRecord(raw, baseSlug) {
  const nazwa = String(raw.nazwa ?? '').trim()
  const slug = baseSlug ?? slugify(nazwa)
  return {
    nazwa,
    slug,
    opis_seo: raw.opis_seo != null ? String(raw.opis_seo) : null,
    ludzie: raw.ludzie != null && typeof raw.ludzie === 'object' ? raw.ludzie : null,
    styl_architektoniczny: raw.styl_architektoniczny != null ? String(raw.styl_architektoniczny) : null,
    adres_full: raw.adres_full != null ? String(raw.adres_full) : null,
    metadata: raw.metadata != null && typeof raw.metadata === 'object' ? raw.metadata : (raw ? { ...raw } : {}),
  }
}

/**
 * Sprawdza, czy operacje bota są włączone (flaga aktywne).
 * @param {boolean} isActive
 * @returns {{ allowed: boolean, error?: string }}
 */
export function checkBotActive(isActive) {
  if (isActive !== true) {
    return { allowed: false, error: 'Operacje bota są wyłączone (aktywne: false)' }
  }
  return { allowed: true }
}

/**
 * Główna funkcja przetwarzania: walidacja, flaga aktywne, slug, rekord.
 * Nie zapisuje do Directus – tylko przygotowuje dane i ewentualnie zwraca błąd.
 * @param {unknown} body – body z POST (JSON z Dify)
 * @param {Object} options
 * @param {boolean} options.botActive – flaga aktywne z ustawień konta bota
 * @param {function(string): Promise<boolean>} [options.slugExists] – async (slug) => true jeśli slug już istnieje
 * @returns {Promise<{ success: true, record: Record<string, unknown> } | { success: false, error: string }>}
 */
export async function processChurchTask(body, { botActive, slugExists }) {
  const activeCheck = checkBotActive(botActive)
  if (!activeCheck.allowed) {
    return { success: false, error: activeCheck.error }
  }

  const validation = validateChurchPayload(body)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const raw = /** @type {Record<string, unknown>} */ (body)
  let slug = slugify(raw.nazwa)
  if (!slug) slug = 'kosciol'

  if (typeof slugExists === 'function') {
    let candidate = slug
    let n = 0
    while (await slugExists(candidate)) {
      n += 1
      candidate = `${slug}-${n}`
    }
    slug = candidate
  }

  const record = toChurchRecord(raw, slug)
  return { success: true, record }
}
