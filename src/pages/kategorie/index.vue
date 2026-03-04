<script setup lang="ts">
definePageMeta({ layout: 'default' })
const { data: lista } = await useFetch('/api/kategorie')

useHead({
  title: 'Kategorie | Katalog kościołów',
  meta: [{ name: 'description', content: 'Kościoły według kategorii: zabytkowe, nowoczesne, z parkingiem.' }],
})
</script>

<template>
  <div class="page">
    <h1>Kategorie</h1>
    <ul v-if="lista?.length" class="link-list">
      <li v-for="k in lista" :key="k.id">
        <NuxtLink v-if="k.slug" :to="`/kategorie/${k.slug}`" class="card">
          <span class="name">{{ k.nazwa }}</span>
          <span v-if="k.opis" class="desc">{{ k.opis }}</span>
        </NuxtLink>
      </li>
    </ul>
    <p v-else-if="lista && lista.length === 0" class="empty">Brak kategorii w bazie.</p>
    <p v-else class="loading">Ładowanie…</p>
  </div>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; }
h1 { font-size: 1.75rem; margin: 0 0 1.5rem; }
.link-list { list-style: none; padding: 0; margin: 0; }
.link-list .card { display: block; padding: 0.75rem 1rem; background: #fff; border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 0.5rem; text-decoration: none; color: inherit; }
.link-list .card:hover { border-color: #0d6efd; }
.link-list .name { font-weight: 600; }
.link-list .desc { display: block; font-size: 0.9rem; color: #6c757d; margin-top: 0.25rem; }
.empty, .loading { color: #6c757d; }
</style>
