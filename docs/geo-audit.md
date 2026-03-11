# Audyt modelu GEO – kolekcje i pola do normalizacji

## Słowniki GEO (źródło prawdy)

| Kolekcja        | Pola                    | Relacje           | Normalizacja |
|-----------------|-------------------------|-------------------|--------------|
| **region**      | slug, nazwa            | —                 | standardizeName(nazwa, 'region'); deduplikacja po nazwie |
| **miasto**      | slug, nazwa, region_id  | region_id → region | standardizeName(nazwa, 'miasto'); find po (nazwa, region_id); getOrCreateRegion → getOrCreateMiasto |
| **archidiecezja** | nazwa                 | —                 | standardizeName(nazwa, 'archidiecezja') – usuwa prefiks "Archidiecezja "; deduplikacja |
| **dekanat**     | nazwa, archidiecezja_id | archidiecezja_id → archidiecezja | standardizeName(nazwa, 'dekanat') – usuwa prefiks "Dekanat "; find po (nazwa, archidiecezja_id) |

## Kolekcje korzystające ze słowników (M2O)

| Kolekcja            | Pole        | Relacja do        | Wymagana normalizacja |
|---------------------|-------------|-------------------|------------------------|
| **adres_pocztowy**  | miasto_id   | miasto            | Zawsze ustawiać na podstawie miejscowosc (+ opcjonalnie region). Tekstowe `miejscowosc` pozostaje jako etykieta; źródłem prawdy jest miasto_id. |
| **kosciol_katolicki** | adres_id, dekanat_id | adres_pocztowy, dekanat | Już obsługiwane przez upsertChurchData (getOrCreate* w server/utils/upsert-dictionaries.js). |

## Relacje M2O w init-db.js (potwierdzone)

- `miasto.region_id` → region  
- `adres_pocztowy.miasto_id` → miasto  
- `dekanat.archidiecezja_id` → archidiecezja  
- `kosciol_katolicki.dekanat_id` → dekanat  
- `kosciol_katolicki.adres_id` → adres_pocztowy  

## Kolekcje bez zmian w schemacie GEO

- **kategoria**, **kosciol_kategoria** – brak pól GEO.  
- **relacje_przestrzenne** – pola tekstowe `zawartyWMiejscu`, `zawieraMiejsce` (nazwa lub URL miejsca). Opcjonalnie w przyszłości: dopasowanie do słownika miasto lub nowa kolekcja „miejsce”.  
- **wydarzenie**, **opinia**, **cechy_obiektu**, **certyfikat**, **dodatkowa_wlasciwosc**, **godziny_otwarcia_szczegoly**, **nabozenstwo**, **duchowienstwo** – brak pól odwołujących się do region/miasto/archidiecezja/dekanat.  

## Podsumowanie

Wszystkie miejsca, gdzie semantycznie występuje województwo/miasto/archidiecezja/dekanat, są już powiązane relacjami M2O ze słownikami (region, miasto, archidiecezja, dekanat). Normalizacja i deduplikacja realizowana jest w **server/utils/upsert-dictionaries.js** przy imporcie kościoła (POST /items/kosciol_katolicki). Do zrobienia: backfill `adres_pocztowy.miasto_id` dla istniejących rekordów oraz analiza i merge duplikatów w archidiecezja/dekanat.
