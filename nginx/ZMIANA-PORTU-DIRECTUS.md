# Zmiana portu Directus (publiczny 8056, wewnętrzny 8057)

Żeby Nginx mógł nasłuchiwać na **8056** (adres publiczny) i przekierowywać ruch do Directus, Directus musi działać na **8057** (wewnętrznie; port 8055 jest zajęty przez inną BD).

---

## 1. Zmienne w `.env`

```env
# Directus w Dockerze na porcie 8057 (Nginx publicznie na 8056; 8055 zajęty)
DIRECTUS_PORT=8057

# Adres publiczny (klienci: http://db.aionflow.pl:8056)
PUBLIC_URL=http://db.aionflow.pl:8056

# Adres dla Nuxt (połączenie wewnętrzne)
DIRECTUS_URL=http://localhost:8057
```

---

## 2. Uruchomienie zmian (Docker)

Po zapisaniu `.env` uruchom ponownie kontenery:

```bash
cd /root/katalog_kosciolow
docker compose down
docker compose up -d
```

Albo jednorazowo z przeładowaniem zmiennych:

```bash
docker compose down
docker compose --env-file .env up -d
```

---

## 3. Sprawdzenie

- Directus: **http://localhost:8057** (lub przez Nginx: **http://db.aionflow.pl:8056**).

---

## 4. Jeśli wcześniej Directus był na 5056

Jeśli w `.env` było `DIRECTUS_PORT=5056`:

1. Ustaw **DIRECTUS_PORT=8057**, **DIRECTUS_URL=http://localhost:8057**, **PUBLIC_URL=http://db.aionflow.pl:8056**.
2. Wykonaj `docker compose down` i `docker compose up -d`.
3. Nginx nasłuchuje na **8056** (patrz `nginx/WDROZENIE-PROXY.md`).
