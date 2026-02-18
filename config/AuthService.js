import axios from 'axios'

const DEFAULT_PORT = 8056

/**
 * Tworzy klienta HTTP do komunikacji z Directus.
 * Domyślnie port 8056.
 * @param {Object} options
 * @param {string} [options.url] – bazowy URL (np. http://localhost:8056)
 * @param {string} [options.token] – token statyczny (admin)
 * @param {number} [options.port] – port (nadpisuje url, jeśli podany)
 */
export function createDirectusClient({ url, token, port }) {
  const baseURL = url || (port ? `http://localhost:${port}` : `http://localhost:${DEFAULT_PORT}`)
  const client = axios.create({
    baseURL: baseURL.replace(/\/$/, ''),
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  return {
    get baseURL() {
      return client.defaults.baseURL
    },

    async get(endpoint, config = {}) {
      const { data } = await client.get(endpoint, config)
      return data
    },

    async post(endpoint, body, config = {}) {
      const { data } = await client.post(endpoint, body, config)
      return data
    },

    async patch(endpoint, body, config = {}) {
      const { data } = await client.patch(endpoint, body, config)
      return data
    },

    async delete(endpoint, config = {}) {
      const { data } = await client.delete(endpoint, config)
      return data
    },

    /** Sprawdzenie połączenia (ping) */
    async ping() {
      const res = await client.get('/server/ping').catch(() => null)
      return res?.status === 200
    },
  }
}

export { DEFAULT_PORT }
