<script setup lang="ts">
definePageMeta({ layout: 'default' })
const { data: blogData } = await useFetch('/api/blog')

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return iso
  }
}

useHead({
  title: 'Blog | Katalog kościołów',
  meta: [{ name: 'description', content: 'Wpisy na blogu – informacje o kościołach.' }],
})
</script>

<template>
  <div class="page">
    <h1>Blog</h1>
    <ul v-if="blogData?.items?.length" class="post-list">
      <li v-for="p in blogData.items" :key="p.id" class="post-item">
        <NuxtLink v-if="p.slug" :to="`/blog/${p.slug}`" class="post-link">
          <h2 class="post-title">{{ p.tytul }}</h2>
          <time v-if="p.dataPublikacji" :datetime="p.dataPublikacji" class="post-date">{{ formatDate(p.dataPublikacji) }}</time>
        </NuxtLink>
      </li>
    </ul>
    <p v-else-if="blogData && !blogData.items?.length" class="empty">Brak wpisów.</p>
    <p v-else class="loading">Ładowanie…</p>
  </div>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; }
h1 { font-size: 1.75rem; margin: 0 0 1.5rem; }
.post-list { list-style: none; padding: 0; margin: 0; }
.post-item { margin-bottom: 1rem; }
.post-link { display: block; padding: 1rem; background: #fff; border: 1px solid #dee2e6; border-radius: 8px; text-decoration: none; color: inherit; }
.post-link:hover { border-color: #0d6efd; }
.post-title { font-size: 1.1rem; margin: 0 0 0.25rem; }
.post-date { font-size: 0.9rem; color: #6c757d; }
.empty, .loading { color: #6c757d; }
</style>
