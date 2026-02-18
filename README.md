# Katalog kościołów – mikroserwis Nuxt

Autonomiczny mikroserwis do zbierania, strukturyzacji i indeksowania danych o kościołach. Przyjmuje przefiltrowane JSON z Dify, wzbogaca o parametry SEO i zapisuje w Directus (port 8056).

## Wymagania

- Node.js 18+
- Directus (np. na porcie 8056)
- Token admina Directus

## Instalacja

```bash
cp .env.example .env
# Edytuj .env: DIRECTUS_URL, DIRECTUS_TOKEN, opcjonalnie BOT_AKTYWNE

npm install
npm run init-db
```

## Uruchomienie

```bash
npm run dev
```

Endpoint: **POST /church-task** – odbiera dane z wtyczki Dify.

## Konfiguracja (.env)

| Zmienna | Opis | Domyślnie |
|--------|------|-----------|
| `DIRECTUS_URL` | Adres Directus | `http://localhost:8056` |
| `DIRECTUS_TOKEN` | Token statyczny (admin) | – |
| `BOT_AKTYWNE` | Włączenie operacji bota (`true`/`false`) | `true` |

## Struktura

- **config/AuthService.js** – klient HTTP do Directus (domyślnie port 8056)
- **scripts/init-db.js** – tworzenie kolekcji `sk_koscioly` i pól w Directus
- **src/processor.js** – przetwarzanie JSON z Dify: walidacja, slug, flaga `aktywne`
- **server/routes/church-task.post.js** – endpoint POST /church-task dla Dify

## Schemat kolekcji `sk_koscioly`

| Pole | Typ | Opis |
|------|-----|------|
| nazwa | string | Nazwa kościoła |
| slug | string (unique) | Przyjazny URL z nazwy |
| opis_seo | text | Meta description |
| ludzie | json | Duchowieństwo i pracownicy |
| styl_architektoniczny | string | Np. Gotyk, Barok |
| adres_full | string | Pełny adres (lokalne SEO) |
| metadata | json | Surowe dane z Perplexity |

## API – POST /church-task

**Request:** body JSON z Dify (min. `nazwa`).

**Sukces:** `{ "success": true }`

**Błąd:** `{ "success": false, "error": "opis błędu" }`

Przykłady błędów: brak lub pusta `nazwa`, wyłączony bot (`BOT_AKTYWNE=false`), błąd zapisu do Directus.

## Skrypty

- `npm run dev` – serwer deweloperski
- `npm run build` / `npm run preview` – produkcja
- `npm run init-db` – konfiguracja schematu w Directus (wymaga .env)
