<script setup lang="ts">
definePageMeta({ layout: 'default' })
const route = useRoute()
const searchQuery = ref((route.query.q as string) || '')

function doSearch() {
  const v = searchQuery.value?.trim()
  if (v) navigateTo({ path: '/koscioly', query: { q: v } })
  else navigateTo('/koscioly')
}

const apiUrl = computed(() => {
  const q = route.query.q as string
  return q ? `/api/koscioly?q=${encodeURIComponent(q)}` : '/api/koscioly'
})
const { data: list } = await useFetch<{ id: number; nazwa: string; slug: string }[]>(apiUrl)
</script>

<template>
  <div class="page list-page">
    <main class="main">
      <h1>Kościoły</h1>
      <form @submit.prevent="doSearch" class="search-form">
        <input v-model="searchQuery" type="search" placeholder="Szukaj po nazwie..." class="search-input" />
        <button type="submit" class="btn">Szukaj</button>
      </form>
      <ul v-if="list?.length" class="church-list">
        <li v-for="c in list" :key="c.id">
          <NuxtLink v-if="c.slug" :to="`/koscioly/${c.slug}`" class="card">
            <span class="name">{{ c.nazwa || '(bez nazwy)' }}</span>
            <span class="slug">/{{ c.slug }}</span>
          </NuxtLink>
          <div v-else class="card card--disabled">
            <span class="name">{{ c.nazwa || '(bez nazwy)' }}</span>
            <span class="hint">Brak slug</span>
          </div>
        </li>
      </ul>
      <p v-else-if="list && list.length === 0" class="empty">
        Brak kościołów w bazie. Dodaj rekordy w Directus (kolekcja <strong>kosciol_katolicki</strong>) i ustaw pole <code>slug</code>.
      </p>
      <p v-else class="loading">Ładowanie…</p>
    </main>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f8f9fa; }
.header { background: #fff; border-bottom: 1px solid #dee2e6; padding: 0.75rem 1.5rem; }
.logo { font-weight: 700; color: #212529; text-decoration: none; font-size: 1.1rem; }
.main { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem; }
h1 { font-size: 1.75rem; margin: 0 0 1rem; color: #212529; }
.search-form { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
.search-input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #dee2e6; border-radius: 6px; }
.search-form .btn { padding: 0.5rem 1rem; background: #0d6efd; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
.church-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
.church-list .card { display: block; padding: 1rem 1.25rem; background: #fff; border-radius: 8px; border: 1px solid #dee2e6; text-decoration: none; color: inherit; transition: border-color 0.15s, box-shadow 0.15s; }
.church-list .card:hover { border-color: #0d6efd; box-shadow: 0 2px 8px rgba(13,110,253,0.12); }
.church-list .name { font-weight: 600; color: #212529; }
.church-list .slug { color: #6c757d; font-size: 0.9rem; margin-left: 0.5rem; }
.church-list .card--disabled { cursor: default; }
.church-list .hint { font-size: 0.85rem; color: #6c757d; margin-left: 0.5rem; }
.empty, .loading { color: #6c757d; }
code { background: #e9ecef; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.9rem; }
</style>
