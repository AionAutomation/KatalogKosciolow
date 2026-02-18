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
    botAccount: {
      active: process.env.BOT_AKTYWNE !== 'false',
    },
  },
  srcDir: 'src',
  alias: {
    '#config': join(__dirname, 'config'),
    '#processor': join(__dirname, 'src', 'processor.js'),
  },
})
