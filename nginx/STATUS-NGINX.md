# Nginx – stan po wdrożeniu proxy na 8056

## Co zostało zrobione

1. **Wyłączono** w Nginx vhosty, które nasłuchują na portach 80/443 (pliki w `sites-available` dalej są, usunięto tylko symlinki z `sites-enabled`):
   - `ai.aionflow.pl`
   - `db.aionflow.pl`
   - `n8n.aionflow.pl`

2. **Włączony** jest tylko `directus-proxy.conf` (nasłuch na **8056**).

3. **Uruchomiono** Nginx – nasłuchuje na **8056** i przekierowuje:
   - **POST** `/items/kosciol_katolicki` → Nuxt (port 3000)
   - **Reszta** → Directus (port 8057)

## Adres do importu (POST)

```
http://db.aionflow.pl:8056/items/kosciol_katolicki
```

## Uwaga: port 80/443

Ruch na **db.aionflow.pl** na portach **80** i **443** obsługuje **Docker** (docker-proxy), nie Nginx. Te vhosty w Nginx (db, ai, n8n) i tak wcześniej nie działały, bo Nginx nie mógł się związać z 80/443.

Jeśli kiedyś zechcesz z powrotem obsługiwać te hosty w Nginx (na jakimś innym porcie), wystarczy przywrócić symlinki w `sites-enabled` i upewnić się, że Nginx nie próbuje słuchać na 80/443 (np. zmienić w tych vhostach `listen` na inny port).

## Przywracanie vhostów (opcjonalnie)

```bash
cd /etc/nginx/sites-enabled
sudo ln -s /etc/nginx/sites-available/db.aionflow.pl .
# (i ewentualnie ai, n8n)
sudo nginx -t
```

Uwaga: jeśli te vhosty mają `listen 80`, Nginx przy starcie/reloadzie znowu nie zbinduje 80 (port zajęty) i może nie wystartować. Wtedy trzeba albo zmienić w nich port, albo trzymać tylko directus-proxy w sites-enabled.
