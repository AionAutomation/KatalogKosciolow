# Testy GEO i relacji – POST /items/kosciol_katolicki

Endpoint `POST /items/kosciol_katolicki` (lub `POST /api/koscioly/import`) obsługiwany jest przez **upsertChurchData**: słowniki (region, miasto, archidiecezja, dekanat, adres, organizacja, ocena_zbiorcza) są rozwiązywane przez getOrCreate* z normalizacją. Poniżej przykładowe payloady do weryfikacji.

## Wymagane

- **nazwa** – obowiązkowe (string, niepuste).
- Nagłówek: `Content-Type: application/json`.
- Autoryzacja: zgodnie z konfiguracją (token w nagłówku lub brak przy publicznym proxy).

---

## 1. Region w adres_id.region

```json
{
  "nazwa": "Kościół św. Jana",
  "adres_id": {
    "ulicaIBudynek": "ul. Główna 1",
    "miejscowosc": "Szczecin",
    "kodPocztowy": "70-001",
    "kraj": "Polska",
    "region": "zachodniopomorskie"
  },
  "dekanat_id": {
    "nazwa": "Dekanat Szczecin",
    "archidiecezja_id": { "nazwa": "Archidiecezja Szczecińsko-Kamieńska" }
  }
}
```

Oczekiwane: utworzenie lub użycie regionu „zachodniopomorskie”, miasto „Szczecin” z `region_id`, adres z `miasto_id`, dekanat z archidiecezją (bez duplikatów przy powtórnym wysłaniu).

---

## 2. Region i miasto na top-level

```json
{
  "nazwa": "Parafia św. Anny",
  "region": { "nazwa": "Mazowieckie" },
  "miasto": { "nazwa": "Warszawa" },
  "adres_id": {
    "ulicaIBudynek": "ul. Krakowskie Przedmieście 1",
    "miejscowosc": "Warszawa",
    "kodPocztowy": "00-001",
    "kraj": "Polska"
  },
  "dekanat_id": {
    "nazwa": "Dekanat Warszawa Śródmieście",
    "archidiecezja_id": { "nazwa": "Szczecińsko-Kamieńska" }
  }
}
```

Oczekiwane: ten sam rekord archidiecezji co przy „Archidiecezja Szczecińsko-Kamieńska” (normalizacja prefiksu), miasto Warszawa z region_id Mazowieckie.

---

## 3. Różna pisownia miasta (case / spacje)

Dwa requesty z tą samą miejscowością w różnej formie:

**A:**
```json
{
  "nazwa": "Kościół A",
  "adres_id": {
    "ulicaIBudynek": "ul. Test 1",
    "miejscowosc": "Szczecin",
    "kodPocztowy": "70-001",
    "kraj": "Polska"
  }
}
```

**B:**
```json
{
  "nazwa": "Kościół B",
  "adres_id": {
    "ulicaIBudynek": "ul. Inna 2",
    "miejscowosc": "  SZCZECIN  ",
    "kodPocztowy": "70-002",
    "kraj": "Polska"
  }
}
```

Oczekiwane: jeden rekord w kolekcji `miasto` dla „Szczecin”, dwa adresy z tym samym `miasto_id`.

---

## 4. Dekanat z prefiksem i bez

**A:**
```json
{
  "nazwa": "Kościół X",
  "dekanat_id": {
    "nazwa": "Dekanat Białystok Bacieczki",
    "archidiecezja_id": { "nazwa": "Archidiecezja Białostocka" }
  }
}
```

**B:**
```json
{
  "nazwa": "Kościół Y",
  "dekanat_id": {
    "nazwa": "Białystok Bacieczki",
    "archidiecezja_id": { "nazwa": "Białostocka" }
  }
}
```

Oczekiwane: po normalizacji jeden rekord archidiecezji, jeden dekanat (ten sam przy tej samej archidiecezji), oba kościoły z tym samym `dekanat_id`.

---

## 5. Weryfikacja po testach

- **GET** `/items/region?limit=-1` – liczba regionów bez wzrostu przy powtórnych requestach z tym samym województwem.
- **GET** `/items/miasto?limit=-1` – jeden Szczecin, jeden Warszawa itd.
- **GET** `/items/archidiecezja?limit=-1` – brak duplikatów typu „Archidiecezja X” i „X”.
- **GET** `/items/dekanat?limit=-1` – brak duplikatów typu „Dekanat Y” i „Y” przy tej samej archidiecezji.
- **GET** `/items/adres_pocztowy?fields=id,miejscowosc,miasto_id&limit=-1` – rekordy z ustawionym `miasto_id` (po backfill lub po nowych importach).

---

## Migracje (na kopii bazy)

1. **Backfill miasto_id:**  
   `node scripts/backfill-miasto-for-adres.js`

2. **Analiza duplikatów struktury:**  
   `node scripts/analyze-structure-duplicates.js`  
   → raport w `scripts/geo-duplicates-report.json`

3. **Merge duplikatów (po przejrzeniu raportu):**  
   `node scripts/merge-structure-duplicates.js`  
   Zalecany backup bazy przed uruchomieniem.
