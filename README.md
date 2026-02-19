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
- `npm run directus:start` – uruchomienie Directus na **porcie 8056** (gdy 8055 jest zajęty)

### Directus na porcie 8056 (npm)

Na serwerze, gdzie 8055 jest zajęty, uruchamiaj Directus przez:

```bash
npm run directus:start
```

Directus będzie dostępny pod `http://localhost:8056` (lub `http://<adres-serwera>:8056`).  
Jeśli panel ma być dostępny pod innym adresem (np. domena lub HTTPS), przed startem ustaw zmienną:

```bash
PUBLIC_URL=https://twoja-domena.pl:8056 npm run directus:start
```

### Directus w Dockerze (port 8056, inny niż 8055)

Directus można uruchomić w Dockerze na porcie **8056** (bez zajmowania domyślnego 8055):

1. Skopiuj szablon zmiennych i ustaw `KEY` oraz `SECRET` (min. 32 znaki, np. `openssl rand -hex 32`):

```bash
cp env.docker.example .env.docker
# Edytuj .env.docker: KEY, SECRET, ewentualnie ADMIN_EMAIL, ADMIN_PASSWORD
```

2. Uruchom stack (PostgreSQL + Directus):

```bash
docker compose --env-file .env.docker up -d
```

Albo jeśli trzymasz zmienne w głównym `.env` (DIRECTUS_PORT, KEY, SECRET, POSTGRES_*, ADMIN_*):

```bash
docker compose up -d
```

Panel: **http://localhost:8056**. Po pierwszym uruchomieniu zaloguj się kontem admin, utwórz token w Directus i ustaw w `.env` aplikacji: `DIRECTUS_URL=http://localhost:8056`, `DIRECTUS_TOKEN=<token>`.
