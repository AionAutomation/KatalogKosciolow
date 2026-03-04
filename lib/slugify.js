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
  s = s.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (c) => map[c] ?? c)
  s = s.replace(/[^a-z0-9\s-]/g, '')
  s = s.replace(/\s+/g, '-').replace(/-+/g, '-')
  return s.replace(/^-|-$/g, '') || 'kosciol'
}
