<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { data: ostatnioDodane } = await useFetch('/api/koscioly', {
  params: { limit: 6, sort: '-date_created' },
})
const { data: miasta } = await useFetch('/api/miasta')
const { data: regiony } = await useFetch('/api/regiony')
const { data: kategorie } = await useFetch('/api/kategorie')
const { data: blogData } = await useFetch('/api/blog', { params: { limit: 4 } })

const route = useRoute()
const searchQuery = ref('')

function doSearch() {
  const q = (searchQuery.value || '').trim()
  if (q) navigateTo(`/koscioly?q=${encodeURIComponent(q)}`)
}

useHead({
  title: 'Katalog kościołów',
  meta: [
    { name: 'description', content: 'Katalog kościołów w Polsce. Szukaj kościołów według miasta, regionu i kategorii.' },
  ],
})
</script>

<template>
  <div class="page home-page">
    <h1>Katalog kościołów</h1>
    <p class="lead">Szukaj kościołów według lokalizacji i kategorii.</p>

    <section class="section search-section">
      <h2>Wyszukiwarka</h2>
      <form @submit.prevent="doSearch" class="search-form">
        <input v-model="searchQuery" type="text" placeholder="Szukaj kościoła..." class="search-input" />
        <button type="submit" class="btn">Szukaj</button>
      </form>
    </section>

    <section v-if="miasta?.length" class="section">
      <h2>Popularne miasta</h2>
      <ul class="link-grid">
        <li v-for="m in miasta" :key="m.id">
          <NuxtLink v-if="m.slug" :to="`/miasta/${m.slug}`">{{ m.nazwa }}</NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="regiony?.length" class="section">
      <h2>Regiony</h2>
      <ul class="link-grid">
        <li v-for="r in regiony" :key="r.id">
          <NuxtLink v-if="r.slug" :to="`/regiony/${r.slug}`">{{ r.nazwa }}</NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="kategorie?.length" class="section">
      <h2>Kategorie</h2>
      <ul class="link-grid">
        <li v-for="k in kategorie" :key="k.id">
          <NuxtLink v-if="k.slug" :to="`/kategorie/${k.slug}`">{{ k.nazwa }}</NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="blogData?.items?.length" class="section">
      <h2>Ostatnie wpisy na blogu</h2>
      <ul class="blog-preview">
        <li v-for="b in blogData.items" :key="b.id">
          <NuxtLink v-if="b.slug" :to="`/blog/${b.slug}`">{{ b.tytul }}</NuxtLink>
        </li>
      </ul>
      <NuxtLink to="/blog" class="link-more">Wszystkie wpisy →</NuxtLink>
    </section>

    <section v-if="ostatnioDodane?.length" class="section">
      <h2>Ostatnio dodane kościoły</h2>
      <ul class="church-preview">
        <li v-for="c in ostatnioDodane" :key="c.id">
          <NuxtLink v-if="c.slug" :to="`/koscioly/${c.slug}`">{{ c.nazwa || '(bez nazwy)' }}</NuxtLink>
        </li>
      </ul>
      <NuxtLink to="/koscioly" class="link-more">Wszystkie kościoły →</NuxtLink>
    </section>

    <section v-else class="section">
      <NuxtLink to="/koscioly" class="btn">Przejdź do listy kościołów</NuxtLink>
    </section>
  </div>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; }
h1 { font-size: 1.75rem; margin: 0 0 0.5rem; }
.lead { color: #6c757d; margin: 0 0 2rem; }
.section { margin-bottom: 2rem; }
.section h2 { font-size: 1.1rem; margin: 0 0 0.75rem; color: #495057; }
.search-form { display: flex; gap: 0.5rem; }
.search-input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #dee2e6; border-radius: 6px; }
.btn { padding: 0.5rem 1rem; background: #0d6efd; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.95rem; }
.btn:hover { background: #0b5ed7; }
.link-grid { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.5rem; }
.link-grid a { display: inline-block; padding: 0.35rem 0.75rem; background: #fff; border: 1px solid #dee2e6; border-radius: 6px; color: #212529; text-decoration: none; font-size: 0.9rem; }
.link-grid a:hover { border-color: #0d6efd; color: #0d6efd; }
.blog-preview, .church-preview { list-style: none; padding: 0; margin: 0 0 0.5rem; }
.blog-preview li, .church-preview li { margin-bottom: 0.35rem; }
.blog-preview a, .church-preview a { color: #0d6efd; text-decoration: none; }
.blog-preview a:hover, .church-preview a:hover { text-decoration: underline; }
.link-more { font-size: 0.9rem; color: #6c757d; text-decoration: none; }
.link-more:hover { color: #0d6efd; }
</style>
