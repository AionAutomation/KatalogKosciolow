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

// CatholicChurch = Place + Thing
// Thing: name→string, description→text, disambiguatingDescription→text, identifier→string, url→string,
//   potentialAction→json(Action), additionalType→json, alternateName→json, mainEntityOfPage→string, sameAs→json(URL), subjectOf→json,
//   image/logo→uuid(file). Place: address→M2O, aggregateRating→M2O, telephone/faxNumber/slogan/keywords→string,
//   latitude/longitude→float, openingHoursSpecification→string(+tabela), hasMap/hasGS1DigitalLink→string(URL), photo→uuid(file).

const KOSCIOL_KATOLICKI = {
  collection: 'kosciol_katolicki',
  meta: { icon: 'church', note: 'CatholicChurch = Place + Thing (schema.org)' },
  fields: [
    // Thing — Text / URL (slug: najpierw nullable, potem uruchom scripts/fill-slug-existing.js i ustaw wymagane w Directus)
    { field: 'slug', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', note: 'Unikalny URL (np. kosciol-sw-anny-warszawa). Dla istniejącej bazy: node scripts/fill-slug-existing.js' } },
    { field: 'nazwa', type: 'string', schema: {}, meta: { interface: 'input' } },                    // name (Text)
    { field: 'opis', type: 'text', schema: {}, meta: { interface: 'input-rich-text-html' } },         // description (Text)
    { field: 'krotkiOpisWyrozniajacy', type: 'text', schema: {}, meta: { interface: 'input-multiline' } }, // disambiguatingDescription (Text)
    { field: 'stronaWww', type: 'string', schema: {}, meta: { interface: 'input' } },                  // url (URL)
    { field: 'alternatywnaNazwa', type: 'text', schema: {}, meta: { interface: 'input-multiline', note: 'Jedna nazwa w każdej linii (alternateName)' } }, // alternateName (Text, array)
    { field: 'glownyTematStrony', type: 'string', schema: {}, meta: { interface: 'input' } },        // mainEntityOfPage (CreativeWork or URL)
    { field: 'linkiZewnetrzne', type: 'text', schema: {}, meta: { interface: 'input-multiline', note: 'Jedna domena/URL w każdej linii (sameAs)' } },     // sameAs (URL, array)
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
    { field: 'dekanat_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },     // dekanat (np. Dekanat Białystok Bacieczki)
  ],
}

// Place: event → Event. Event: name→Text, startDate→DateTime, endDate→DateTime

const WYDARZENIE = {
  collection: 'wydarzenie',
  meta: { icon: 'event', note: 'Event (schema.org)' },
  fields: [
    { field: 'nazwa', type: 'string', schema: {}, meta: { interface: 'input' } },   // name (Text)
    { field: 'dataRozpoczecia', type: 'dateTime', schema: { is_nullable: true }, meta: { interface: 'datetime' } }, // startDate (DateTime)
    { field: 'dataZakonczenia', type: 'dateTime', schema: { is_nullable: true }, meta: { interface: 'datetime' } }, // endDate (DateTime)
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
// --- KROK 1: Tabele słownikowe ---
// PostalAddress: streetAddress, addressLocality, postalCode, addressCountry → Text → string

// Region (województwo) – GEO
const REGION = {
  collection: 'region',
  meta: { icon: 'public', note: 'Region / województwo (GEO)' },
  fields: [
    { field: 'slug', type: 'string', schema: {}, meta: { interface: 'input' } },
    { field: 'nazwa', type: 'string', schema: {}, meta: { interface: 'input' } },
  ],
}

// Miasto – GEO
const MIASTO = {
  collection: 'miasto',
  meta: { icon: 'location_city', note: 'Miasto (GEO)' },
  fields: [
    { field: 'slug', type: 'string', schema: {}, meta: { interface: 'input' } },
    { field: 'nazwa', type: 'string', schema: {}, meta: { interface: 'input' } },
    { field: 'region_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },
  ],
}

// Kategoria kościoła (zabytkowe, nowoczesne, z parkingiem)
const KATEGORIA = {
  collection: 'kategoria',
  meta: { icon: 'category', note: 'Kategoria kościoła' },
  fields: [
    { field: 'slug', type: 'string', schema: {}, meta: { interface: 'input' } },
    { field: 'nazwa', type: 'string', schema: {}, meta: { interface: 'input' } },
    { field: 'opis', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-multiline' } },
  ],
}

// M2M: kościół ↔ kategoria
const KOSCIOL_KATEGORIA = {
  collection: 'kosciol_kategoria',
  meta: { icon: 'link', note: 'Relacja kościół–kategoria (M2M)' },
  fields: [
    { field: 'kosciol_id', type: 'integer', schema: {}, meta: { interface: 'select-dropdown-m2o' } },
    { field: 'kategoria_id', type: 'integer', schema: {}, meta: { interface: 'select-dropdown-m2o' } },
  ],
}

// Blog post
const BLOG_POST = {
  collection: 'blog_post',
  meta: { icon: 'article', note: 'Wpis na blogu' },
  fields: [
    { field: 'slug', type: 'string', schema: {}, meta: { interface: 'input' } },
    { field: 'tytul', type: 'string', schema: {}, meta: { interface: 'input' } },
    { field: 'tresc', type: 'text', schema: {}, meta: { interface: 'input-rich-text-html' } },
    { field: 'dataPublikacji', type: 'dateTime', schema: { is_nullable: true }, meta: { interface: 'datetime' } },
    { field: 'obraz_id', type: 'uuid', schema: { is_nullable: true }, meta: { interface: 'file-image' } },
    { field: 'opis_seo', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-multiline' } },
  ],
}

const ADRES_POCZTOWY = {
  collection: 'adres_pocztowy',
  meta: { icon: 'location_on', note: 'PostalAddress (schema.org)' },
  fields: [
    { field: 'ulicaIBudynek', type: 'string', schema: {}, meta: { interface: 'input' } },   // streetAddress
    { field: 'miejscowosc', type: 'string', schema: {}, meta: { interface: 'input' } },     // addressLocality
    { field: 'kodPocztowy', type: 'string', schema: {}, meta: { interface: 'input' } },     // postalCode
    { field: 'kraj', type: 'string', schema: {}, meta: { interface: 'input' } },           // addressCountry
    { field: 'miasto_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o', note: 'Miasto (GEO)' } },
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

// Struktura kościelna: archidiecezja (np. Archidiecezja białostocka)

const ARCHIDIECEZJA = {
  collection: 'archidiecezja',
  meta: { icon: 'account_balance', note: 'Archidiecezja (np. Archidiecezja białostocka)' },
  fields: [
    { field: 'nazwa', type: 'string', schema: {}, meta: { interface: 'input' } },
  ],
}

// Dekanat (np. Dekanat Białystok Bacieczki) – należy do archidiecezji

const DEKANAT = {
  collection: 'dekanat',
  meta: { icon: 'groups', note: 'Dekanat (np. Dekanat Białystok Bacieczki)' },
  fields: [
    { field: 'nazwa', type: 'string', schema: {}, meta: { interface: 'input' } },
    { field: 'archidiecezja_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },
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

// Place: openingHoursSpecification / specialOpeningHoursSpecification. DayOfWeek→Text, opens/closes→Time, special→Boolean

const GODZINY_OTWARCIA_SZCZEGOLY = {
  collection: 'godziny_otwarcia_szczegoly',
  meta: { icon: 'schedule', note: 'OpeningHoursSpecification (schema.org)' },
  fields: [
    { field: 'dzienTygodnia', type: 'string', schema: {}, meta: { interface: 'input' } },   // dayOfWeek (Text or DayOfWeek)
    { field: 'otwarcie', type: 'time', schema: { is_nullable: true }, meta: { interface: 'input' } },         // opens (Time) – null gdy dzień zamknięty
    { field: 'zamkniecie', type: 'time', schema: { is_nullable: true }, meta: { interface: 'input' } },      // closes (Time) – null gdy dzień zamknięty
    { field: 'czySpecjalne', type: 'boolean', schema: {}, meta: { interface: 'boolean' } }, // special (specialOpeningHoursSpecification)
    { field: 'kosciol_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },
  ],
}

// Nabożeństwa – msze św., różaniec, adoracja itp.
const NABOZENSTWO = {
  collection: 'nabozenstwo',
  meta: { icon: 'church', note: 'Nabożeństwa (msze św., różaniec, adoracja)' },
  fields: [
    { field: 'nazwa', type: 'string', schema: {}, meta: { interface: 'input', note: 'Np. Msza św., Różaniec, Adoracja' } },
    { field: 'dzienTygodnia', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', note: 'Np. Niedziela, Dni powszednie, Sobota' } },
    { field: 'godzina', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', note: 'Godzina lub godziny, np. 8:00 lub 8:00, 10:00, 12:00' } },
    { field: 'uwagi', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-multiline', note: 'Opcjonalne uwagi' } },
    { field: 'kosciol_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },
  ],
}

// Duchowieństwo – kapłani i osoby związane z parafią/kościołem
const DUCHOWIENSTWO = {
  collection: 'duchowienstwo',
  meta: { icon: 'person', note: 'Duchowieństwo (ks., imię, nazwisko, rola, dyżur w konfesjonale)' },
  fields: [
    { field: 'tytul', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', note: 'Tytuł przed imieniem, np. ks., bp., o.' } },
    { field: 'imie', type: 'string', schema: {}, meta: { interface: 'input' } },
    { field: 'nazwisko', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input' } },
    { field: 'rola', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', note: 'Rola w parafii/kościele' } },
    { field: 'dodatkowo', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', note: 'Np. Wicedziekan, opiekun, katecheta' } },
    { field: 'kontakt', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', note: 'Telefon, e-mail itp.' } },
    { field: 'dyzurKonfesjonal', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-multiline', note: 'Dyżur w konfesjonale, np. niedziela podczas Mszy św. o 8:30' } },
    { field: 'kosciol_id', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'select-dropdown-m2o' } },
  ],
}

// Relacje M2O: [ many_collection, one_collection, field_many ]
const RELATIONS = [
  ['kosciol_katolicki', 'adres_pocztowy', 'adres_id'],
  ['kosciol_katolicki', 'organizacja', 'organizacja_id'],
  ['kosciol_katolicki', 'ocena_zbiorcza', 'ocenaZbiorcza_id'],
  ['kosciol_katolicki', 'dekanat', 'dekanat_id'],
  ['dekanat', 'archidiecezja', 'archidiecezja_id'],
  ['miasto', 'region', 'region_id'],
  ['adres_pocztowy', 'miasto', 'miasto_id'],
  ['kosciol_kategoria', 'kosciol_katolicki', 'kosciol_id'],
  ['kosciol_kategoria', 'kategoria', 'kategoria_id'],
  ['blog_post', 'directus_files', 'obraz_id'],
  ['cechy_obiektu', 'kosciol_katolicki', 'kosciol_id'],
  ['relacje_przestrzenne', 'kosciol_katolicki', 'kosciol_id'],
  ['certyfikat', 'kosciol_katolicki', 'kosciol_id'],
  ['dodatkowa_wlasciwosc', 'kosciol_katolicki', 'kosciol_id'],
  ['opinia', 'kosciol_katolicki', 'kosciol_id'],
  ['wydarzenie', 'kosciol_katolicki', 'kosciol_id'],
  ['godziny_otwarcia_szczegoly', 'kosciol_katolicki', 'kosciol_id'],
  ['nabozenstwo', 'kosciol_katolicki', 'kosciol_id'],
  ['duchowienstwo', 'kosciol_katolicki', 'kosciol_id'],
]

// Układ w panelu Directus: 1) Główne (bez grupy), 2) Słowniki, 3) Metadane Kościoła
// group musi być nazwą istniejącej kolekcji (folder = kolekcja bez tabeli, schema: null)
const FOLDER_COLLECTIONS = {
  slowniki: { icon: 'folder', note: 'Słowniki / struktura kościelna' },
  metadane_kosciola: { icon: 'folder', note: 'Metadane i szczegóły kościoła' },
  geo: { icon: 'folder', note: 'GEO – miasta i regiony' },
  content: { icon: 'folder', note: 'Treści (blog)' },
}
const COLLECTION_LAYOUT = {
  kosciol_katolicki: { group: null, sort: 1 },
  wydarzenie: { group: null, sort: 2 },
  opinia: { group: null, sort: 3 },
  blog_post: { group: 'content', sort: 4 },
  archidiecezja: { group: 'slowniki', sort: 10 },
  dekanat: { group: 'slowniki', sort: 11 },
  organizacja: { group: 'slowniki', sort: 12 },
  region: { group: 'geo', sort: 13 },
  miasto: { group: 'geo', sort: 14 },
  kategoria: { group: 'geo', sort: 15 },
  kosciol_kategoria: { group: 'geo', sort: 16 },
  adres_pocztowy: { group: 'metadane_kosciola', sort: 20 },
  relacje_przestrzenne: { group: 'metadane_kosciola', sort: 21 },
  godziny_otwarcia_szczegoly: { group: 'metadane_kosciola', sort: 22 },
  nabozenstwo: { group: 'metadane_kosciola', sort: 23 },
  dodatkowa_wlasciwosc: { group: 'metadane_kosciola', sort: 24 },
  ocena_zbiorcza: { group: 'metadane_kosciola', sort: 25 },
  certyfikat: { group: 'metadane_kosciola', sort: 26 },
  cechy_obiektu: { group: 'metadane_kosciola', sort: 27 },
  duchowienstwo: { group: 'metadane_kosciola', sort: 28 },
}

// --- Helper: pobierz listę kolekcji ---
async function getCollections(directus) {
  const raw = await directus.get('/collections').catch(() => null)
  const list = Array.isArray(raw) ? raw : (raw?.data ?? [])
  return list
}

// --- Kolekcje‑foldery (bez tabeli): group w directus_collections wskazuje na nazwę kolekcji ---
async function ensureFolderCollection(directus, collection, meta) {
  const collections = await getCollections(directus)
  if (collections.some((c) => c.collection === collection)) {
    console.log(`[OK] Folder "${collection}" już istnieje.`)
    return
  }
  await directus.post('/collections', {
    collection,
    meta: { icon: meta?.icon ?? 'folder', note: meta?.note ?? '' },
    schema: null,
  })
  console.log(`[+] Utworzono folder: ${collection}`)
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
    meta: {
      icon: meta?.icon ?? 'folder',
      note: meta?.note ?? '',
      ...(COLLECTION_LAYOUT[collection]
        ? {
            group: COLLECTION_LAYOUT[collection].group,
            sort: COLLECTION_LAYOUT[collection].sort,
          }
        : {}),
    },
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

// --- Układ sidebaru: grupy (foldery) i kolejność kolekcji ---
async function applyCollectionLayout(directus) {
  console.log('--- Układ panelu: grupy i kolejność ---')
  for (const [collection, { group, sort }] of Object.entries(COLLECTION_LAYOUT)) {
    try {
      await directus.patch(`/collections/${collection}`, {
        meta: { group, sort },
      })
      console.log(`  [OK] ${collection} → group: ${group ?? '(główne)'}, sort: ${sort}`)
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.message || err.message
      console.warn(`  [!] ${collection}: ${msg}`)
    }
  }
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
  console.log('--- KROK 0: Foldery (grupy w panelu) ---')

  try {
    for (const [name, meta] of Object.entries(FOLDER_COLLECTIONS)) {
      await ensureFolderCollection(directus, name, meta)
    }
    console.log('--- KROK 1: Tabele słownikowe ---')
    await ensureCollection(directus, REGION)
    await ensureCollection(directus, MIASTO)
    await ensureCollection(directus, KATEGORIA)
    await ensureCollection(directus, KOSCIOL_KATEGORIA)
    await ensureCollection(directus, BLOG_POST)
    await ensureCollection(directus, ADRES_POCZTOWY)
    await ensureCollection(directus, ORGANIZACJA)
    await ensureCollection(directus, OCENA_ZBIORCZA)
    await ensureCollection(directus, ARCHIDIECEZJA)
    await ensureCollection(directus, DEKANAT)

    console.log('--- KROK 2: Kolekcja główna KosciolKatolicki ---')
    await ensureCollection(directus, KOSCIOL_KATOLICKI)

    console.log('--- Relacje M2O dla KosciolKatolicki ---')
    await ensureRelation(directus, 'kosciol_katolicki', 'adres_pocztowy', 'adres_id')
    await ensureRelation(directus, 'kosciol_katolicki', 'organizacja', 'organizacja_id')
    await ensureRelation(directus, 'kosciol_katolicki', 'ocena_zbiorcza', 'ocenaZbiorcza_id')
    await ensureRelation(directus, 'kosciol_katolicki', 'dekanat', 'dekanat_id')
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
    await ensureCollection(directus, NABOZENSTWO)
    await ensureCollection(directus, DUCHOWIENSTWO)

    console.log('--- Relacje M2O: rozszerzenia -> KosciolKatolicki ---')
    for (const [manyCol, oneCol, fieldMany] of RELATIONS) {
      if (manyCol === 'kosciol_katolicki') continue // już zrobione
      await ensureRelation(directus, manyCol, oneCol, fieldMany)
    }

    await applyCollectionLayout(directus)

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
