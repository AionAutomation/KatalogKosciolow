<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({
  title: 'O projekcie | Katalog kościołów',
  meta: [{ name: 'description', content: 'Informacje o projekcie Katalog kościołów.' }],
})
</script>

<template>
  <div class="page">
    <h1>O projekcie</h1>
    <p>Katalog kościołów to projekt mający na celu udostępnienie informacji o kościołach w Polsce. Dane przechowywane są w Directus, a frontend zbudowany w Nuxt z naciskiem na SEO i GEO.</p>
  </div>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; }
h1 { font-size: 1.75rem; margin: 0 0 1rem; }
p { line-height: 1.6; }
</style>
