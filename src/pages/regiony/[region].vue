<script setup lang="ts">
definePageMeta({ layout: 'default' })
const route = useRoute()
const regionSlug = route.params.region as string
const { data: lista, error } = await useFetch(`/api/regiony/${regionSlug}`)

const regionNazwa = regionSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

useHead({
  title: `Kościoły w regionie ${regionNazwa} | Katalog kościołów`,
  meta: [{ name: 'description', content: `Lista kościołów w regionie ${regionNazwa}.` }],
})
</script>

<template>
  <div class="page">
    <nav class="breadcrumb">
      <NuxtLink to="/">Strona główna</NuxtLink>
      <span>/</span>
      <NuxtLink to="/regiony">Regiony</NuxtLink>
      <span>/</span>
      <span>{{ regionNazwa }}</span>
    </nav>
    <h1>Kościoły w regionie {{ regionNazwa }}</h1>
    <ul v-if="lista?.length" class="church-list">
      <li v-for="c in lista" :key="c.id">
        <NuxtLink v-if="c.slug" :to="`/koscioly/${c.slug}`" class="card">
          {{ c.nazwa || '(bez nazwy)' }}
        </NuxtLink>
      </li>
    </ul>
    <p v-else-if="error" class="error">{{ error.statusMessage || 'Błąd ładowania' }}</p>
    <p v-else-if="lista && lista.length === 0" class="empty">Brak kościołów w tym regionie.</p>
    <p v-else class="loading">Ładowanie…</p>
  </div>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; }
.breadcrumb { font-size: 0.9rem; color: #6c757d; margin-bottom: 1rem; }
.breadcrumb a { color: #0d6efd; text-decoration: none; }
.breadcrumb span { margin: 0 0.35rem; }
h1 { font-size: 1.75rem; margin: 0 0 1.5rem; }
.church-list { list-style: none; padding: 0; margin: 0; }
.church-list .card { display: block; padding: 0.75rem 1rem; background: #fff; border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 0.5rem; text-decoration: none; color: inherit; }
.church-list .card:hover { border-color: #0d6efd; }
.empty, .loading, .error { color: #6c757d; }
</style>
