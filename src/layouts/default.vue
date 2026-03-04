<template>
  <div class="layout">
    <header class="site-header">
      <NuxtLink to="/" class="logo">Katalog kościołów</NuxtLink>
      <nav class="nav">
        <NuxtLink to="/koscioly">Kościoły</NuxtLink>
        <NuxtLink to="/miasta">Miasta</NuxtLink>
        <NuxtLink to="/regiony">Regiony</NuxtLink>
        <NuxtLink to="/kategorie">Kategorie</NuxtLink>
        <NuxtLink to="/blog">Blog</NuxtLink>
        <NuxtLink to="/o-projekcie">O projekcie</NuxtLink>
        <NuxtLink to="/kontakt">Kontakt</NuxtLink>
      </nav>
    </header>
    <main class="main">
      <slot />
    </main>
    <footer class="site-footer">
      <NuxtLink to="/o-projekcie">O projekcie</NuxtLink>
      <NuxtLink to="/kontakt">Kontakt</NuxtLink>
      <NuxtLink to="/polityka-prywatnosci">Polityka prywatności</NuxtLink>
    </footer>
  </div>
</template>

<style scoped>
.layout { min-height: 100vh; display: flex; flex-direction: column; }
.site-header { background: #fff; border-bottom: 1px solid #dee2e6; padding: 0.75rem 1.5rem; display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.logo { font-weight: 700; color: #212529; text-decoration: none; font-size: 1.1rem; margin-right: auto; }
.nav { display: flex; gap: 1rem; flex-wrap: wrap; }
.nav a { color: #495057; text-decoration: none; font-size: 0.95rem; }
.nav a:hover { color: #0d6efd; }
.main { flex: 1; padding: 2rem 1.5rem; }
.site-footer { background: #f8f9fa; border-top: 1px solid #dee2e6; padding: 1rem 1.5rem; display: flex; gap: 1.5rem; font-size: 0.9rem; }
.site-footer a { color: #6c757d; text-decoration: none; }
.site-footer a:hover { color: #0d6efd; }
</style>
