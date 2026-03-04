<script setup lang="ts">
definePageMeta({ layout: 'default' })
const { data: lista } = await useFetch('/api/regiony')

useHead({
  title: 'Regiony | Katalog kościołów',
  meta: [{ name: 'description', content: 'Kościoły według regionów (województw).' }],
})
</script>

<template>
  <div class="page">
    <h1>Regiony</h1>
    <ul v-if="lista?.length" class="link-list">
      <li v-for="r in lista" :key="r.id">
        <NuxtLink v-if="r.slug" :to="`/regiony/${r.slug}`">{{ r.nazwa }}</NuxtLink>
      </li>
    </ul>
    <p v-else-if="lista && lista.length === 0" class="empty">Brak regionów w bazie.</p>
    <p v-else class="loading">Ładowanie…</p>
  </div>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; }
h1 { font-size: 1.75rem; margin: 0 0 1.5rem; }
.link-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.link-list a { display: block; padding: 0.75rem 1rem; background: #fff; border: 1px solid #dee2e6; border-radius: 8px; text-decoration: none; color: inherit; }
.link-list a:hover { border-color: #0d6efd; color: #0d6efd; }
.empty, .loading { color: #6c757d; }
</style>
