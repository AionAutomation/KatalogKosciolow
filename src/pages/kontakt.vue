<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({
  title: 'Kontakt | Katalog kościołów',
  meta: [{ name: 'description', content: 'Skontaktuj się z nami.' }],
})
</script>

<template>
  <div class="page">
    <h1>Kontakt</h1>
    <p>W razie pytań lub sugestii prosimy o kontakt.</p>
  </div>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; }
h1 { font-size: 1.75rem; margin: 0 0 1rem; }
p { line-height: 1.6; }
</style>
