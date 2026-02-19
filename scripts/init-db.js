/**
 * Skrypt inicjalizacji schematu Directus: schema.org/CatholicChurch (Place + Thing)
 * Port 8056. Uruchomienie: node scripts/init-db.js
 * Wymaga .env: DIRECTUS_URL, DIRECTUS_TOKEN
 *
 * Mapowanie Schema.org Expected Type → Directus:
 *   Text / URL (krótki)     → string
 *   Text (długi, opis)      → text
 *   Boolean                 → boolean
 *   Integer                 → integer
 *   Number                  → float
 *   GeoCoordinates / GeospatialGeometry → geometry (PostGIS)
 *   ImageObject / URL (plik) → uuid + relacja do directus_files
 *   Złożone (Action, Place ref, array URL) → json
 *   OpeningHoursSpecification → tabela godziny_otwarcia_szczegoly (dayOfWeek=string, opens/closes=time)
 *   Event                   → tabela wydarzenie (name=string, startDate/endDate=dateTime)
 *   PostalAddress, AggregateRating, Review, Certification, PropertyValue → relacje / tabele
 */
import 'dotenv/config'
import { createDirectusClient } from '../config/AuthService.js'

const DIRECTUS_PORT = 8056
const BASE_URL = process.env.DIRECTUS_URL || `http://localhost:${DIRECTUS_PORT}`

// --- KROK 1: Tabele słownikowe ---
// PostalAddress: streetAddress, addressLocality, postalCode, addressCountry → Text → string

const ADRES_POCZTOWY = {
  collection: 'adres_pocztowy',
  meta: { icon: 'location_on', note: 'PostalAddress (schema.org)' },
  fields: [
    { field: 'ulicaIBudynek', type: 'string', schema: {}, meta: { interface: 'input' } },   // streetAddress
    { field: 'miejscowosc', type: 'string', schema: {}, meta: { interface: 'input' } },     // addressLocality
    { field: 'kodPocztowy', type: 'string', schema: {}, meta: { interface: 'input' } },     // postalCode
    { field: 'kraj', type: 'string', schema: {}, meta: { interface: 'input' } },           // addressCountry
  ],
}

// Organization: name, type, telephone → Text; url → URL → string

const ORGANIZACJA = {
  collection: 'organizacja',
  meta: { icon: 'business', note: 'Organization (schema.org)' },
  fields: [
    { field: 'nazwa', type: 'string', schema: {}, meta: { interface: 'input' } },       // name
    { field: 'typ', type: 'string', schema: {}, meta: { interface: 'input' } },        // type
    { field: 'telefon', type: 'string', schema: {}, meta: { interface: 'input' } },     // telephone
    { field: 'stronaWww', type: 'string', schema: {}, meta: { interface: 'input' } },    // url
  ],
}

// AggregateRating: ratingValue → Number → float; reviewCount → Integer → integer

const OCENA_ZBIORCZA = {
  collection: 'ocena_zbiorcza',
  meta: { icon: 'star', note: 'AggregateRating (schema.org)' },
  fields: [
    { field: 'sredniaOcena', type: 'float', schema: {}, meta: { interface: 'input' } },    // ratingValue
    { field: 'liczbaOpinii', type: 'integer', schema: {}, meta: { interface: 'input' } }, // reviewCount
  ],
}

// CatholicChurch = Place + Thing
// Thing: name→string, description→text, disambiguatingDescription→text, identifier→string, url→string,
//   potentialAction→json(Action), additionalType→json, alternateName→json, mainEntityOfPage→string, sameAs→json(URL), subjectOf→json,
//   image/logo→uuid(file). Place: address→M2O, aggregateRating→M2O, telephone/faxNumber/slogan/keywords→string,
//   latitude/longitude→float, openingHoursSpecification→string(+tabela), hasMap/hasGS1DigitalLink→string(URL), photo→uuid(file).

const KOSCIOL_KATOLICKI = {
  collection: 'kosciol_katolicki',
  meta: { icon: 'church', note: 'CatholicChurch = Place + Thing (schema.org)' },
  fields: [
    // Thing — Text / URL
    { field: 'nazwa', type: 'string', schema: {}, meta: { interface: 'input' } },                    // name (Text)
    { field: 'opis', type: 'text', schema: {}, meta: { interface: 'input-rich-text-html' } },         // description (Text)
    { field: 'krotkiOpisWyrozniajacy', type: 'text', schema: {}, meta: { interface: 'input-multiline' } }, // disambiguatingDescription (Text)
    { field: 'identyfikator', type: 'string', schema: {}, meta: { interface: 'input' } },             // identifier (PropertyValue or Text or URL)
    { field: 'stronaWww', type: 'string', schema: {}, meta: { interface: 'input' } },                  // url (URL)
    { field: 'potencjalnaAkcja', type: 'json', schema: {}, meta: { interface: 'input-code' } },       // potentialAction (Action – obiekt)
    { field: 'alternatywnaNazwa', type: 'text', schema: {}, meta: { interface: 'input-multiline', note: 'Jedna nazwa w każdej linii (alternateName)' } }, // alternateName (Text, array)
    { field: 'dodatkowyTyp', type: 'text', schema: {}, meta: { interface: 'input-multiline', note: 'Typ lub URL w każdej linii (additionalType)' } },      // additionalType (Text or URL, array)
    { field: 'glownyTematStrony', type: 'string', schema: {}, meta: { interface: 'input' } },        // mainEntityOfPage (CreativeWork or URL)
    { field: 'linkiZewnetrzne', type: 'text', schema: {}, meta: { interface: 'input-multiline', note: 'Jedna domena/URL w każdej linii (sameAs)' } },     // sameAs (URL, array)
    { field: 'tematDla', type: 'json', schema: {}, meta: { interface: 'input-code' } },              // subjectOf (CreativeWork or Event – obiekt)
    // Place — Text, Number, URL
    { field: 'telefon', type: 'string', schema: {}, meta: { interface: 'input' } },                  // telephone (Text)
    { field: 'faks', type: 'string', schema: {}, meta: { interface: 'input' } },                     // faxNumber (Text)
    { field: 'slogan', type: 'string', schema: {}, meta: { interface: 'input' } },                   // slogan (Text)
    { field: 'slowaKluczowe', type: 'string', schema: {}, meta: { interface: 'input' } },            // keywords (Text or URL)
    { field: 'szerokoscGeograficzna', type: 'float', schema: {}, meta: { interface: 'input' } },      // latitude (Number)
    { field: 'dlugoscGeograficzna', type: 'float', schema: {}, meta: { interface: 'input' } },       // longitude (Number)
    { field: 'godzinyOtwarcia', type: 'string', schema: {}, meta: { interface: 'input' } },           // openingHoursSpecification (skrót; szczegóły w tabeli)
    { field: 'mapaUrl', type: 'string', schema: {}, meta: { interface: 'input' } },                  // hasMap (Map or URL)
    { field: 'linkCyfrowyGS1', type: 'string', schema: {}, meta: { interface: 'input' } },          // hasGS1DigitalLink (URL)
    { field: 'logo', type: 'uuid', schema: { is_nullable: true }, meta: { interface: 'file-image' } }, // logo (ImageObject or URL)
    { field: 'obraz', type: 'uuid', schema: { is_nullable: true }, meta: { interface: 'file-image' } }, // image (ImageObject or URL)
    { field: 'zdjecie', type: 'uuid', schema: { is_nullable: true }, meta: { interface: 'file-image' } }, // photo (ImageObject or Photograph)
    // M2O — Place: address (PostalAddress), aggregateRating (AggregateRating); Thing: owner (Organization)
    { field: 'adres_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },       // address
    { field: 'organizacja_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } }, // owner
    { field: 'ocenaZbiorcza_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } }, // aggregateRating
  ],
}

// Place: isAccessibleForFree, publicAccess, smokingAllowed, hasDriveThroughService→Boolean; maximumAttendeeCapacity→Integer;
// tourBookingPage→URL, branchCode, globalLocationNumber, isicV4→Text → string

const CECHY_OBIEKTU = {
  collection: 'cechy_obiektu',
  meta: { icon: 'tune', note: 'Place: amenityFeature / branchCode / capacity / tourBookingPage (schema.org)' },
  fields: [
    { field: 'darmowyWstep', type: 'boolean', schema: {}, meta: { interface: 'boolean' } },           // isAccessibleForFree (Boolean)
    { field: 'dostepPubliczny', type: 'boolean', schema: {}, meta: { interface: 'boolean' } },      // publicAccess (Boolean)
    { field: 'moznaPalic', type: 'boolean', schema: {}, meta: { interface: 'boolean' } },             // smokingAllowed (Boolean)
    { field: 'maksymalnaPojemnosc', type: 'integer', schema: {}, meta: { interface: 'input' } },      // maximumAttendeeCapacity (Integer)
    { field: 'obslugaDriveThrough', type: 'boolean', schema: {}, meta: { interface: 'boolean' } },   // hasDriveThroughService (Boolean)
    { field: 'stronaRezerwacjiWycieczek', type: 'string', schema: {}, meta: { interface: 'input' } }, // tourBookingPage (URL)
    { field: 'kodOddzialu', type: 'string', schema: {}, meta: { interface: 'input' } },              // branchCode (Text)
    { field: 'globalnyNumerLokalizacyjny', type: 'string', schema: {}, meta: { interface: 'input' } }, // globalLocationNumber (Text)
    { field: 'kodISICV4', type: 'string', schema: {}, meta: { interface: 'input' } },                // isicV4 (Text)
    { field: 'kosciol_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },
  ],
}

// Place: geo→geometry; containedInPlace, containsPlace→Place(ref)→json; geoContains, geoCoveredBy, geoCovers, geoCrosses,
// geoDisjoint, geoEquals, geoIntersects, geoOverlaps, geoTouches, geoWithin → GeospatialGeometry → geometry (PostGIS)

const RELACJE_PRZESTRZENNE = {
  collection: 'relacje_przestrzenne',
  meta: { icon: 'map', note: 'Place: geo, containedInPlace, containsPlace, geo* (schema.org)' },
  fields: [
    { field: 'geometria', type: 'geometry', schema: {}, meta: { interface: 'map' } },       // geo (GeoCoordinates or GeoShape)
    { field: 'zawartyWMiejscu', type: 'string', schema: {}, meta: { interface: 'input', note: 'Nazwa lub URL miejsca nadrzędnego (containedInPlace)' } },  // containedInPlace (Place)
    { field: 'zawieraMiejsce', type: 'text', schema: {}, meta: { interface: 'input-multiline', note: 'Jedno zawarte miejsce w linii – nazwa lub URL (containsPlace)' } },   // containsPlace (Place)
    { field: 'geoZawiera', type: 'geometry', schema: {}, meta: { interface: 'map' } },     // geoContains
    { field: 'geoPokrytyPrzez', type: 'geometry', schema: {}, meta: { interface: 'map' } }, // geoCoveredBy
    { field: 'geoPokrywa', type: 'geometry', schema: {}, meta: { interface: 'map' } },      // geoCovers
    { field: 'geoPrzecina', type: 'geometry', schema: {}, meta: { interface: 'map' } },     // geoCrosses
    { field: 'geoRozlaczny', type: 'geometry', schema: {}, meta: { interface: 'map' } },    // geoDisjoint
    { field: 'geoRowny', type: 'geometry', schema: {}, meta: { interface: 'map' } },       // geoEquals
    { field: 'geoPrzecinaSie', type: 'geometry', schema: {}, meta: { interface: 'map' } }, // geoIntersects
    { field: 'geoNaklagaSie', type: 'geometry', schema: {}, meta: { interface: 'map' } },  // geoOverlaps
    { field: 'geoDotyka', type: 'geometry', schema: {}, meta: { interface: 'map' } },      // geoTouches
    { field: 'geoWewnatrz', type: 'geometry', schema: {}, meta: { interface: 'map' } },     // geoWithin
    { field: 'kosciol_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },
  ],
}

// Place: hasCertification → Certification. Certification: name→Text, (url)→URL → string

const CERTYFIKAT = {
  collection: 'certyfikat',
  meta: { icon: 'verified', note: 'Certification (schema.org)' },
  fields: [
    { field: 'nazwa', type: 'string', schema: {}, meta: { interface: 'input' } },   // name (Text)
    { field: 'stronaWww', type: 'string', schema: {}, meta: { interface: 'input' } }, // url (URL)
    { field: 'kosciol_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },
  ],
}

// Place: additionalProperty → PropertyValue. PropertyValue: name→Text, value→Text → string

const DODATKOWA_WLASCIWOSC = {
  collection: 'dodatkowa_wlasciwosc',
  meta: { icon: 'label', note: 'PropertyValue / additionalProperty (schema.org)' },
  fields: [
    { field: 'nazwa', type: 'string', schema: {}, meta: { interface: 'input' } },   // name (Text)
    { field: 'wartosc', type: 'string', schema: {}, meta: { interface: 'input' } }, // value (Text)
    { field: 'kosciol_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },
  ],
}

// Place: review → Review. Review: author→Person or Text, reviewBody→Text, reviewRating→Integer or Rating

const OPINIA = {
  collection: 'opinia',
  meta: { icon: 'rate_review', note: 'Review (schema.org)' },
  fields: [
    { field: 'autor', type: 'string', schema: {}, meta: { interface: 'input' } },       // author (Text)
    { field: 'trescOpinii', type: 'text', schema: {}, meta: { interface: 'input-multiline' } }, // reviewBody (Text)
    { field: 'ocena', type: 'integer', schema: {}, meta: { interface: 'input' } },       // reviewRating (Integer)
    { field: 'kosciol_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },
  ],
}

// Place: event → Event. Event: name→Text, startDate→DateTime, endDate→DateTime

const WYDARZENIE = {
  collection: 'wydarzenie',
  meta: { icon: 'event', note: 'Event (schema.org)' },
  fields: [
    { field: 'nazwa', type: 'string', schema: {}, meta: { interface: 'input' } },   // name (Text)
    { field: 'dataRozpoczecia', type: 'dateTime', schema: {}, meta: { interface: 'datetime' } }, // startDate (DateTime)
    { field: 'dataZakonczenia', type: 'dateTime', schema: {}, meta: { interface: 'datetime' } }, // endDate (DateTime)
    { field: 'kosciol_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },
  ],
}

// Place: openingHoursSpecification / specialOpeningHoursSpecification. DayOfWeek→Text, opens/closes→Time, special→Boolean

const GODZINY_OTWARCIA_SZCZEGOLY = {
  collection: 'godziny_otwarcia_szczegoly',
  meta: { icon: 'schedule', note: 'OpeningHoursSpecification (schema.org)' },
  fields: [
    { field: 'dzienTygodnia', type: 'string', schema: {}, meta: { interface: 'input' } },   // dayOfWeek (Text or DayOfWeek)
    { field: 'otwarcie', type: 'time', schema: {}, meta: { interface: 'input' } },         // opens (Time)
    { field: 'zamkniecie', type: 'time', schema: {}, meta: { interface: 'input' } },      // closes (Time)
    { field: 'czySpecjalne', type: 'boolean', schema: {}, meta: { interface: 'boolean' } }, // special (specialOpeningHoursSpecification)
    { field: 'kosciol_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },
  ],
}

// Relacje M2O: [ many_collection, one_collection, field_many ]
const RELATIONS = [
  ['kosciol_katolicki', 'adres_pocztowy', 'adres_id'],
  ['kosciol_katolicki', 'organizacja', 'organizacja_id'],
  ['kosciol_katolicki', 'ocena_zbiorcza', 'ocenaZbiorcza_id'],
  ['cechy_obiektu', 'kosciol_katolicki', 'kosciol_id'],
  ['relacje_przestrzenne', 'kosciol_katolicki', 'kosciol_id'],
  ['certyfikat', 'kosciol_katolicki', 'kosciol_id'],
  ['dodatkowa_wlasciwosc', 'kosciol_katolicki', 'kosciol_id'],
  ['opinia', 'kosciol_katolicki', 'kosciol_id'],
  ['wydarzenie', 'kosciol_katolicki', 'kosciol_id'],
  ['godziny_otwarcia_szczegoly', 'kosciol_katolicki', 'kosciol_id'],
]

// --- Helper: pobierz listę kolekcji ---
async function getCollections(directus) {
  const raw = await directus.get('/collections').catch(() => null)
  const list = Array.isArray(raw) ? raw : (raw?.data ?? [])
  return list
}

// --- Helper: pobierz listę pól w kolekcji ---
async function getFieldNames(directus, collection) {
  const raw = await directus.get(`/fields/${collection}`).catch(() => [])
  const list = Array.isArray(raw) ? raw : (raw?.data ?? [])
  return new Set(list.map((f) => f.field))
}

// --- Helper: pobierz listę relacji ---
async function getRelations(directus) {
  const raw = await directus.get('/relations').catch(() => null)
  const list = Array.isArray(raw) ? raw : (raw?.data ?? [])
  return list
}

// --- Utworzenie kolekcji (jeśli nie istnieje) i pól ---
async function ensureCollection(directus, def) {
  const { collection, meta, fields } = def
  const collections = await getCollections(directus)
  const existing = collections.find((c) => c.collection === collection)

  if (existing) {
    console.log(`[OK] Kolekcja "${collection}" już istnieje.`)
    const names = await getFieldNames(directus, collection)
    for (const fd of fields) {
      if (names.has(fd.field)) {
        console.log(`  - Pole "${fd.field}" już istnieje.`)
        continue
      }
      await directus.post(`/fields/${collection}`, fd)
      console.log(`  + Dodano pole: ${fd.field}`)
    }
    return
  }

  await directus.post('/collections', {
    collection,
    meta: { icon: meta?.icon ?? 'folder', note: meta?.note ?? '' },
    schema: {},
  })
  console.log(`[+] Utworzono kolekcję: ${collection}`)

  for (const fd of fields) {
    await directus.post(`/fields/${collection}`, fd)
    console.log(`  + Dodano pole: ${fd.field}`)
  }
}

// --- Utworzenie relacji M2O (jeśli nie istnieje) ---
function relationMatches(r, manyCollection, oneCollection, fieldMany) {
  const many = r.many_collection ?? r.meta?.many_collection ?? r.collection
  const one = r.one_collection ?? r.meta?.one_collection ?? r.related_collection
  const field = r.many_field ?? r.meta?.many_field ?? r.field
  return many === manyCollection && one === oneCollection && field === fieldMany
}

async function ensureRelation(directus, manyCollection, oneCollection, fieldMany) {
  const relations = await getRelations(directus)
  const exists = relations.some((r) => relationMatches(r, manyCollection, oneCollection, fieldMany))
  if (exists) {
    console.log(`[OK] Relacja ${manyCollection}.${fieldMany} -> ${oneCollection} już istnieje.`)
    return
  }
  // Część wersji Directus wymaga "collection" (format jak w GET); inne używają collection_many/field_many
  const payloads = [
    {
      collection: manyCollection,
      field: fieldMany,
      related_collection: oneCollection,
      schema: {
        table: manyCollection,
        column: fieldMany,
        foreign_key_table: oneCollection,
        foreign_key_column: 'id',
      },
    },
    {
      collection_many: manyCollection,
      collection_one: oneCollection,
      field_many: fieldMany,
      field_one: null,
    },
  ]
  let lastErr
  for (const body of payloads) {
    try {
      await directus.post('/relations', body)
      console.log(`[+] Relacja: ${manyCollection}.${fieldMany} -> ${oneCollection}`)
      return
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

// --- Main ---
async function main() {
  const url = process.env.DIRECTUS_URL || BASE_URL
  const token = process.env.DIRECTUS_TOKEN
  if (!token) {
    console.error('Brak DIRECTUS_TOKEN w .env')
    process.exit(1)
  }

  const directus = createDirectusClient({ url, token })
  console.log('Directus URL:', url)
  console.log('--- KROK 1: Tabele słownikowe ---')

  try {
    // KROK 1: słowniki
    await ensureCollection(directus, ADRES_POCZTOWY)
    await ensureCollection(directus, ORGANIZACJA)
    await ensureCollection(directus, OCENA_ZBIORCZA)

    console.log('--- KROK 2: Kolekcja główna KosciolKatolicki ---')
    await ensureCollection(directus, KOSCIOL_KATOLICKI)

    console.log('--- Relacje M2O dla KosciolKatolicki ---')
    await ensureRelation(directus, 'kosciol_katolicki', 'adres_pocztowy', 'adres_id')
    await ensureRelation(directus, 'kosciol_katolicki', 'organizacja', 'organizacja_id')
    await ensureRelation(directus, 'kosciol_katolicki', 'ocena_zbiorcza', 'ocenaZbiorcza_id')
    await ensureRelation(directus, 'kosciol_katolicki', 'directus_files', 'logo')
    await ensureRelation(directus, 'kosciol_katolicki', 'directus_files', 'obraz')
    await ensureRelation(directus, 'kosciol_katolicki', 'directus_files', 'zdjecie')

    console.log('--- KROK 3: Kolekcje rozszerzające (kosciol_id M2O) ---')
    await ensureCollection(directus, CECHY_OBIEKTU)
    await ensureCollection(directus, RELACJE_PRZESTRZENNE)
    await ensureCollection(directus, CERTYFIKAT)
    await ensureCollection(directus, DODATKOWA_WLASCIWOSC)
    await ensureCollection(directus, OPINIA)
    await ensureCollection(directus, WYDARZENIE)
    await ensureCollection(directus, GODZINY_OTWARCIA_SZCZEGOLY)

    console.log('--- Relacje M2O: rozszerzenia -> KosciolKatolicki ---')
    for (const [manyCol, oneCol, fieldMany] of RELATIONS) {
      if (manyCol === 'kosciol_katolicki') continue // już zrobione
      await ensureRelation(directus, manyCol, oneCol, fieldMany)
    }

    console.log('--- Zakończono. Schemat schema.org/CatholicChurch jest gotowy. ---')
  } catch (err) {
    const msg =
      err.response?.data?.errors?.[0]?.message ||
      err.response?.data?.message ||
      err.message
    console.error('Błąd Directus:', msg || err.response?.data || err)
    process.exit(1)
  }
}

main()
