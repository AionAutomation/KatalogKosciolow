# Katalog kościołów – mikroserwis Nuxt

Frontend Nuxt z danymi w Directus (port 8056). Dane są dodawane bezpośrednio do Directus.

## Wymagania

- Node.js 18+
- Directus (np. na porcie 8056)
- Token admina Directus

## Instalacja

```bash
cp .env.example .env
# Edytuj .env: DIRECTUS_URL, DIRECTUS_TOKEN

npm install
npm run init-db
```

## Uruchomienie

```bash
npm run dev
```

## Konfiguracja (.env)

| Zmienna | Opis | Domyślnie |
|--------|------|-----------|
| `DIRECTUS_URL` | Adres Directus | `http://localhost:8056` |
| `DIRECTUS_TOKEN` | Token statyczny (admin) | – |

## Struktura

- **config/AuthService.js** – klient HTTP do Directus (domyślnie port 8056)
- **scripts/init-db.js** – tworzenie kolekcji w Directus
- **lib/slugify.js** – funkcja slugify (używana przez skrypty)
- **server/api/** – endpointy API do pobierania danych z Directus

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

Baza PostgreSQL w Dockerze używa obrazu **PostGIS** (`postgis/postgis:16-3.4`). Rozszerzenie PostGIS jest włączane przy pierwszym starcie (skrypt `scripts/docker/02-postgis.sql`). Jeśli kontener bazy istniał wcześniej bez PostGIS, włącz je ręcznie: `docker exec -it katalog-directus-postgres psql -U directus -d directus -c "CREATE EXTENSION IF NOT EXISTS postgis;"`
