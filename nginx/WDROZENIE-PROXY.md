# Wdrożenie Nginx proxy dla POST /items/kosciol_katolicki

Dzięki tej konfiguracji **POST** na `http://db.aionflow.pl:8056/items/kosciol_katolicki` trafia do Nuxt (dwufazowy zapis kościoła + O2M). Pozostałe żądania idą do Directus.

---

## Wymagania

- **Directus** nasłuchuje na `127.0.0.1:8057` (port wewnętrzny; 8055 zajęty przez inną BD).
- **Nuxt** nasłuchuje na `127.0.0.1:3000`.
- **Nginx** nasłuchuje na **8056** (adres publiczny dla klientów).
- Na serwerze **Nginx** i uprawnienia do `sites-available` / `sites-enabled`.

---

## Krok 1: Skopiuj konfigurację

Na serwerze (w katalogu projektu lub po zalogowaniu SSH):

```bash
# Z katalogu projektu (np. /root/katalog_kosciolow lub ścieżka do repozytorium)
sudo cp nginx/directus-proxy.conf /etc/nginx/sites-available/directus-proxy.conf
```

Jeśli plik masz tylko w repozytorium, możesz go wkleić ręcznie:

```bash
sudo nano /etc/nginx/sites-available/directus-proxy.conf
```

i wkleić zawartość z `nginx/directus-proxy.conf`.

---

## Krok 2: Dostosuj porty (jeśli potrzeba)

Otwórz plik:

```bash
sudo nano /etc/nginx/sites-available/directus-proxy.conf
```

Sprawdź:

- `listen 8056` – port publiczny (np. db.aionflow.pl:8056).
- `server 127.0.0.1:8057` – port Directus (upstream directus).
- `server 127.0.0.1:3000` – port Nuxt (upstream nuxt).

Zapisz (w nano: Ctrl+O, Enter, Ctrl+X).

---

## Krok 3: Włącz stronę i sprawdź konfigurację

```bash
sudo ln -sf /etc/nginx/sites-available/directus-proxy.conf /etc/nginx/sites-enabled/
sudo nginx -t
```

**Uwaga:** W Nginx nie wolno używać dyrektyw `proxy_*` wewnątrz bloku `if`. Plik `directus-proxy.conf` używa więc przekierowania do lokalizacji wewnętrznej `/_nuxt_kosciol_post` dla metody POST.

Jeśli `nginx -t` zgłosi błąd, popraw konfigurację. Gdy zobaczysz `syntax is ok` i `test is successful`, przeładuj Nginx:

```bash
sudo systemctl reload nginx
```

Jeśli Nginx nie był uruchomiony:

```bash
sudo systemctl start nginx
```

(Gdy porty 80/443 są zajęte przez inny serwer, wyłącz domyślną stronę Nginx: `sudo rm /etc/nginx/sites-enabled/default`, albo uruchom tylko ten vhost na serwerze, gdzie 5056 ma obsługiwać proxy.)

---

## Krok 4: Upewnij się, że Nuxt i Directus działają

- **Nuxt** (np. `npm run dev` lub PM2/systemd) musi nasłuchiwać na **3000**.
- **Directus** na **8057** (w .env: `DIRECTUS_URL=http://localhost:8057`).

Na serwerze:

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8057/server/ping
```

Oba powinny zwrócić 200 (lub inny sukces). Jeśli Nuxt nie działa, POST do `/items/kosciol_katolicki` może zwracać 502.

---

## Krok 5: Test przekierowania

Z zewnątrz (lub z innej maszyny):

```bash
curl -s -w "\nHTTP: %{http_code}\n" -X POST "http://db.aionflow.pl:8056/items/kosciol_katolicki" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TWOJ_DIRECTUS_TOKEN" \
  -d '{"nazwa":"Test proxy","duchowienstwo":[{"tytul":"Ks.","imie":"Jan","nazwisko":"Test","rola":"Proboszcz"}]}'
```

Następnie sprawdź, czy rekord O2M się zapisał (podstaw `ID` z odpowiedzi):

```bash
curl -s -H "Authorization: Bearer TWOJ_DIRECTUS_TOKEN" \
  "http://db.aionflow.pl:8056/items/duchowienstwo?filter[kosciol_id][_eq]=ID"
```

Jeśli w odpowiedzi jest co najmniej jeden element z `kosciol_id` równym `ID`, przekierowanie do Nuxt i dwufazowy zapis działają.

---

## Podsumowanie

| Krok | Polecenie / działanie |
|------|------------------------|
| 1 | `sudo cp nginx/directus-proxy.conf /etc/nginx/sites-available/` |
| 2 | Ewentualna edycja portów w `directus-proxy.conf` |
| 3 | `sudo ln -sf .../directus-proxy.conf .../sites-enabled/` → `nginx -t` → `systemctl reload nginx` |
| 4 | Uruchomienie Nuxt (3000) i Directus (8056), sprawdzenie `curl` |
| 5 | Test POST i GET `duchowienstwo` |

---

## Gdy coś nie działa

- **502 Bad Gateway** – Nuxt najpewniej nie działa na 3000 lub Nginx nie może się do niego połączyć.
- **403 z Directus** – POST trafia do Directus zamiast do Nuxt; sprawdź, czy na porcie **8056** nasłuchuje Nginx z tą konfiguracją (np. `ss -tlnp | grep 8056`).
- **O2M puste** – żądanie nadal idzie do Directus; upewnij się, że w `sites-enabled` jest tylko jedna konfiguracja na port **8056** i że to właśnie `directus-proxy.conf`.
