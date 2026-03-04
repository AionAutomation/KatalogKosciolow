<script setup lang="ts">
interface Crumb {
  label: string
  href?: string
}

const props = defineProps<{
  items: Crumb[]
}>()

const config = useRuntimeConfig()
const siteUrl = (config.public?.siteUrl as string) || (typeof window !== 'undefined' ? window.location.origin : '')

const breadcrumbSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: props.items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.label,
    ...(item.href && { item: `${siteUrl}${item.href}` }),
  })),
}))

useHead({
  script: computed(() => [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(breadcrumbSchema.value),
    },
  ]),
})
</script>

<template>
  <nav class="breadcrumb" aria-label="Nawigacja okruszkowa">
    <template v-for="(item, i) in items" :key="i">
      <NuxtLink v-if="item.href" :to="item.href" class="breadcrumb-link">{{ item.label }}</NuxtLink>
      <span v-else class="breadcrumb-current">{{ item.label }}</span>
      <span v-if="i < items.length - 1" class="breadcrumb-sep">/</span>
    </template>
  </nav>
</template>

<style scoped>
.breadcrumb { font-size: 0.9rem; color: #6c757d; margin-bottom: 1rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; }
.breadcrumb-link { color: #0d6efd; text-decoration: none; }
.breadcrumb-link:hover { text-decoration: underline; }
.breadcrumb-current { color: #212529; }
.breadcrumb-sep { margin: 0 0.25rem; }
</style>
