<script setup lang="ts">
definePageMeta({ layout: 'default' })
const route = useRoute()
const slug = route.params.slug as string
const config = useRuntimeConfig()
const { data: post, error } = await useFetch(`/api/blog/${slug}`)
const directusUrl = (config.public?.directusUrl as string) || ''

useHead({
  title: post.value ? `${post.value.tytul} | Blog | Katalog kościołów` : 'Blog | Katalog kościołów',
  meta: [{ name: 'description', content: post.value?.opis_seo || post.value?.tytul || 'Wpis na blogu' }],
})
</script>

<template>
  <div class="page">
    <nav class="breadcrumb">
      <NuxtLink to="/">Strona główna</NuxtLink>
      <span>/</span>
      <NuxtLink to="/blog">Blog</NuxtLink>
      <span>/</span>
      <span v-if="post">{{ post.tytul }}</span>
    </nav>
    <template v-if="error">
      <p class="error">{{ error.statusMessage || 'Nie znaleziono wpisu.' }}</p>
    </template>
    <template v-else-if="post">
      <article>
        <h1>{{ post.tytul }}</h1>
        <time v-if="post.dataPublikacji" :datetime="post.dataPublikacji" class="date">
          {{ new Date(post.dataPublikacji).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' }) }}
        </time>
        <img v-if="post.obraz_id?.id" :src="`${directusUrl}/assets/${post.obraz_id.id}`" :alt="post.tytul" class="hero-img" />
        <div v-if="post.tresc" class="content" v-html="post.tresc" />
      </article>
    </template>
    <p v-else class="loading">Ładowanie…</p>
  </div>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; }
.breadcrumb { font-size: 0.9rem; color: #6c757d; margin-bottom: 1rem; }
.breadcrumb a { color: #0d6efd; text-decoration: none; }
.breadcrumb span { margin: 0 0.35rem; }
h1 { font-size: 1.75rem; margin: 0 0 0.5rem; }
.date { font-size: 0.9rem; color: #6c757d; display: block; margin-bottom: 1rem; }
.hero-img { max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 1rem; }
.content { line-height: 1.6; }
.error, .loading { color: #6c757d; }
</style>
