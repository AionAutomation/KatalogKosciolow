// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  runtimeConfig: {
    directus: {
      url: process.env.DIRECTUS_URL || 'http://localhost:8056',
      token: process.env.DIRECTUS_TOKEN || '',
    },
    public: {
      directusUrl: process.env.DIRECTUS_URL || 'http://localhost:8056',
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
    },
  },
  srcDir: 'src',
  serverDir: 'server',
  alias: {
    '#config': join(__dirname, 'config'),
  },
  nitro: {
    alias: {
      '#config': join(__dirname, 'config'),
    },
  },
})
