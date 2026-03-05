<script setup lang="ts">
definePageMeta({ layout: 'default' })
const route = useRoute()
const slug = route.params.slug as string
const config = useRuntimeConfig()

const { data: church, error } = await useFetch(`/api/koscioly/${slug}`, {
  key: `church-${slug}`,
})

const directusUrl = (config.public?.directusUrl as string) || ''
const siteUrl = (config.public?.siteUrl as string) || (typeof window !== 'undefined' ? window.location.origin : '')

const breadcrumbSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Strona główna', item: `${siteUrl}/` },
    { '@type': 'ListItem', position: 2, name: 'Kościoły', item: `${siteUrl}/koscioly` },
    { '@type': 'ListItem', position: 3, name: church.value?.nazwa || 'Kościół' },
  ],
}))

const placeSchema = computed(() => {
  const c = church.value
  if (!c) return null
  const addr = c.adres_id && typeof c.adres_id === 'object' ? c.adres_id : null
  const streetAddress = addr ? [addr.ulicaIBudynek, addr.kodPocztowy, addr.miejscowosc, addr.kraj].filter(Boolean).join(', ') : undefined
  return {
    '@context': 'https://schema.org',
    '@type': ['Place', 'Church'],
    name: c.nazwa,
    ...(c.opis && { description: c.opis }),
    ...(streetAddress && { address: { '@type': 'PostalAddress', streetAddress } }),
    ...((c.szerokoscGeograficzna != null && c.dlugoscGeograficzna != null) && {
      geo: { '@type': 'GeoCoordinates', latitude: c.szerokoscGeograficzna, longitude: c.dlugoscGeograficzna },
    }),
    ...(c.telefon && { telephone: c.telefon }),
    ...(c.stronaWww && { url: c.stronaWww }),
    ...(c.godzinyOtwarcia && { openingHours: c.godzinyOtwarcia }),
    ...(c.obraz?.id && { image: `${directusUrl}/assets/${c.obraz.id}` }),
  }
})

useHead({
  title: church.value?.nazwa ? `${church.value.nazwa} | Katalog kościołów` : 'Kościół | Katalog kościołów',
  meta: [
    { name: 'description', content: church.value?.krotkiOpisWyrozniajacy || church.value?.opis?.slice(0, 160) || church.value?.nazwa || '' },
  ],
  script: computed(() => {
    const scripts: { type: string; innerHTML: string }[] = []
    if (breadcrumbSchema.value) {
      scripts.push({ type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumbSchema.value) })
    }
    if (placeSchema.value) {
      scripts.push({ type: 'application/ld+json', innerHTML: JSON.stringify(placeSchema.value) })
    }
    return scripts
  }),
})
</script>

<template>
  <div class="page church-page">
    <main class="main">
      <Breadcrumbs v-if="church" :items="[{ label: 'Strona główna', href: '/' }, { label: 'Kościoły', href: '/koscioly' }, { label: church.nazwa || 'Kościół' }]" />
      <template v-if="error">
        <div class="error-block">
          <h1>Błąd</h1>
          <p>{{ error.statusMessage || 'Nie udało się załadować danych.' }}</p>
          <NuxtLink to="/koscioly" class="btn">Wróć do listy</NuxtLink>
        </div>
      </template>

      <template v-else-if="church">
        <article class="church">
          <div class="hero">
            <img
              v-if="church.obraz?.id"
              :src="`${directusUrl}/assets/${church.obraz.id}`"
              :alt="church.nazwa"
              class="hero-img"
            />
            <div class="hero-content">
              <h1>{{ church.nazwa }}</h1>
              <p v-if="church.dekanat_id && typeof church.dekanat_id === 'object'" class="subtitle">
                {{ church.dekanat_id.nazwa }}
                <template v-if="church.dekanat_id.archidiecezja_id"> · {{ church.dekanat_id.archidiecezja_id.nazwa }}</template>
              </p>
            </div>
          </div>

          <div class="grid">
            <section v-if="church.adres_id && typeof church.adres_id === 'object'" class="card">
              <h2>Adres</h2>
              <p class="address">
                {{ [church.adres_id.ulicaIBudynek, church.adres_id.kodPocztowy, church.adres_id.miejscowosc, church.adres_id.kraj].filter(Boolean).join(', ') }}
              </p>
            </section>

            <section v-if="church.telefon || church.stronaWww" class="card">
              <h2>Kontakt</h2>
              <p v-if="church.telefon">Tel. {{ church.telefon }}</p>
              <p v-if="church.stronaWww">
                <a :href="church.stronaWww" target="_blank" rel="noopener">{{ church.stronaWww }}</a>
              </p>
            </section>

            <section v-if="church.organizacja_id && typeof church.organizacja_id === 'object'" class="card">
              <h2>Organizacja</h2>
              <p>{{ church.organizacja_id.nazwa }}</p>
              <p v-if="church.organizacja_id.telefon">Tel. {{ church.organizacja_id.telefon }}</p>
              <p v-if="church.organizacja_id.stronaWww">
                <a :href="church.organizacja_id.stronaWww" target="_blank" rel="noopener">{{ church.organizacja_id.stronaWww }}</a>
              </p>
            </section>

            <section v-if="church.godzinyOtwarcia" class="card">
              <h2>Godziny otwarcia</h2>
              <p class="text">{{ church.godzinyOtwarcia }}</p>
            </section>

            <section v-if="church.nabozenstwa?.length" class="card">
              <h2>Nabożeństwa</h2>
              <ul class="service-list">
                <li v-for="n in church.nabozenstwa" :key="n.id" class="service-item">
                  <strong>{{ n.nazwa }}</strong>
                  <span v-if="n.dzienTygodnia" class="day">{{ n.dzienTygodnia }}</span>
                  <span class="time">{{ n.godzina }}</span>
                  <p v-if="n.uwagi" class="notes">{{ n.uwagi }}</p>
                </li>
              </ul>
            </section>

            <section v-if="church.ocenaZbiorcza_id && typeof church.ocenaZbiorcza_id === 'object'" class="card">
              <h2>Ocena</h2>
              <p>Średnia {{ church.ocenaZbiorcza_id.sredniaOcena }} ({{ church.ocenaZbiorcza_id.liczbaOpinii }} opinii)</p>
            </section>
          </div>

          <section v-if="church.opis" class="card card--full">
            <h2>Opis</h2>
            <div class="opis" v-html="church.opis" />
          </section>

          <section v-if="church.duchowienstwo?.length" class="card card--full">
            <h2>Duchowieństwo</h2>
            <ul class="clergy-list">
              <li v-for="d in church.duchowienstwo" :key="d.id" class="clergy-item">
                <strong>{{ [d.tytul, d.imie, d.nazwisko].filter(Boolean).join(' ') }}</strong>
                <span v-if="d.rola" class="role">{{ d.rola }}</span>
                <span v-if="d.dodatkowo" class="extra">{{ d.dodatkowo }}</span>
                <p v-if="d.kontakt" class="contact">Kontakt: {{ d.kontakt }}</p>
                <p v-if="d.dyzurKonfesjonal" class="confessional">Dyżur w konfesjonale: {{ d.dyzurKonfesjonal }}</p>
              </li>
            </ul>
          </section>

          <section v-if="church.mapaUrl" class="card card--full">
            <h2>Mapa</h2>
            <a :href="church.mapaUrl" target="_blank" rel="noopener" class="map-link">Otwórz w mapach →</a>
          </section>

          <div class="meta">
            <NuxtLink to="/koscioly" class="btn">← Wszystkie kościoły</NuxtLink>
          </div>
        </article>
      </template>

      <template v-else>
        <p class="loading">Ładowanie…</p>
      </template>
    </main>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f8f9fa; }
.main { max-width: 900px; margin: 0 auto; padding: 0 1.5rem 2rem; }
.error-block { background: #fff; padding: 2rem; border-radius: 8px; border: 1px solid #dee2e6; }
.error-block h1 { margin: 0 0 0.5rem; color: #212529; }
.error-block p { color: #6c757d; margin: 0 0 1rem; }
.btn { display: inline-block; padding: 0.5rem 1rem; background: #0d6efd; color: #fff; border-radius: 6px; text-decoration: none; font-size: 0.95rem; }
.btn:hover { background: #0b5ed7; }
.hero { position: relative; border-radius: 12px; overflow: hidden; background: #212529; margin-bottom: 1.5rem; min-height: 200px; }
.hero-img { width: 100%; height: 280px; object-fit: cover; display: block; }
.hero-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 2rem 1.5rem; background: linear-gradient(transparent, rgba(0,0,0,0.75)); color: #fff; }
.hero-content h1 { margin: 0; font-size: 1.75rem; color: #fff; }
.subtitle { margin: 0.25rem 0 0; opacity: 0.9; font-size: 0.95rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.card { background: #fff; border-radius: 8px; border: 1px solid #dee2e6; padding: 1.25rem; }
.card--full { margin-bottom: 1rem; }
.card h2 { margin: 0 0 0.75rem; font-size: 1rem; color: #495057; font-weight: 600; }
.card p { margin: 0 0 0.5rem; font-size: 0.95rem; color: #212529; }
.card p:last-child { margin-bottom: 0; }
.address, .text { white-space: pre-wrap; }
.card a { color: #0d6efd; }
.opis { line-height: 1.6; color: #212529; }
.clergy-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; }
.clergy-item { padding-bottom: 1rem; border-bottom: 1px solid #eee; }
.clergy-item:last-child { border-bottom: none; padding-bottom: 0; }
.clergy-item strong { display: block; margin-bottom: 0.25rem; }
.role, .extra { display: block; font-size: 0.9rem; color: #6c757d; margin-top: 0.15rem; }
.contact, .confessional { font-size: 0.9rem; margin-top: 0.5rem; color: #495057; }
.map-link { display: inline-block; margin-top: 0.25rem; }
.service-list { list-style: none; padding: 0; margin: 0; }
.service-item { padding-bottom: 0.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #eee; }
.service-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.service-item .day { margin-left: 0.5rem; font-size: 0.9rem; color: #6c757d; }
.service-item .time { display: block; margin-top: 0.2rem; font-weight: 500; }
.service-item .notes { font-size: 0.9rem; color: #6c757d; margin-top: 0.25rem; margin-bottom: 0; }
.meta { margin-top: 1.5rem; }
.loading { color: #6c757d; }
</style>
