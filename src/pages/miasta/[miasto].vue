<script setup lang="ts">
definePageMeta({ layout: 'default' })
const route = useRoute()
const miastoSlug = route.params.miasto as string
const { data: lista, error } = await useFetch(`/api/miasta/${miastoSlug}`)

const miastoNazwa = miastoSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

useHead({
  title: `Kościoły w ${miastoNazwa} | Katalog kościołów`,
  meta: [{ name: 'description', content: `Lista kościołów w ${miastoNazwa}.` }],
})
</script>

<template>
  <div class="page">
    <nav class="breadcrumb">
      <NuxtLink to="/">Strona główna</NuxtLink>
      <span>/</span>
      <NuxtLink to="/miasta">Miasta</NuxtLink>
      <span>/</span>
      <span>{{ miastoNazwa }}</span>
    </nav>
    <h1>Kościoły w {{ miastoNazwa }}</h1>
    <ul v-if="lista?.length" class="church-list">
      <li v-for="c in lista" :key="c.id">
        <NuxtLink v-if="c.slug" :to="`/koscioly/${c.slug}`" class="card">
          {{ c.nazwa || '(bez nazwy)' }}
        </NuxtLink>
      </li>
    </ul>
    <p v-else-if="error" class="error">{{ error.statusMessage || 'Błąd ładowania' }}</p>
    <p v-else-if="lista && lista.length === 0" class="empty">Brak kościołów w tym mieście.</p>
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
