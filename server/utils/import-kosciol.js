/**
 * Wspólna logika transformacji JSON → payload Directus dla importu kościołów.
 */
import { slugify } from './directus.js'

/** Usuwa klucze o wartości null/undefined z obiektu */
export function omitNull(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) {
      out[k] = typeof v === 'object' && !Array.isArray(v) ? omitNull(v) : v
    }
  }
  return out
}

/** Mapuje JSON wejściowy na payload Directus */
export function transformPayload(raw) {
  const payload = {
    nazwa: raw.nazwa,
    opis: raw.opis ?? null,
    krotkiOpisWyrozniajacy: raw.krotkiOpisWyrozniajacy ?? null,
    stronaWww: raw.stronaWww ?? null,
    alternatywnaNazwa: raw.alternatywnaNazwa ?? null,
    glownyTematStrony: raw.glownyTematStrony ?? null,
    linkiZewnetrzne: raw.linkiZewnetrzne ?? null,
    telefon: raw.telefon ?? null,
    faks: raw.faks ?? null,
    slogan: raw.slogan ?? null,
    slowaKluczowe: raw.slowaKluczowe ?? null,
    szerokoscGeograficzna: raw.szerokoscGeograficzna ?? null,
    dlugoscGeograficzna: raw.dlugoscGeograficzna ?? null,
    godzinyOtwarcia: raw.godzinyOtwarcia ?? null,
    mapaUrl: raw.mapaUrl ?? null,
    linkCyfrowyGS1: raw.linkCyfrowyGS1 ?? null,
  }

  if (raw.nazwa && typeof raw.nazwa === 'string') {
    payload.slug = slugify(raw.nazwa) || null
  }

  if (raw.adres_id && typeof raw.adres_id === 'object') {
    payload.adres_id = omitNull({
      ulicaIBudynek: raw.adres_id.ulicaIBudynek ?? null,
      miejscowosc: raw.adres_id.miejscowosc ?? null,
      kodPocztowy: raw.adres_id.kodPocztowy ?? null,
      kraj: raw.adres_id.kraj ?? null,
    })
    if (Object.keys(payload.adres_id).length === 0) delete payload.adres_id
  }

  if (raw.organizacja_id && typeof raw.organizacja_id === 'object') {
    payload.organizacja_id = omitNull({
      nazwa: raw.organizacja_id.nazwa ?? null,
      typ: raw.organizacja_id.typ ?? null,
      telefon: raw.organizacja_id.telefon ?? null,
      stronaWww: raw.organizacja_id.stronaWww ?? null,
    })
    if (Object.keys(payload.organizacja_id).length === 0) delete payload.organizacja_id
  }

  const oza = raw.ocenaZbiorcza_id
  if (oza && typeof oza === 'object' && (oza.sredniaOcena != null || oza.liczbaOpinii != null)) {
    payload.ocenaZbiorcza_id = {
      sredniaOcena: oza.sredniaOcena ?? 0,
      liczbaOpinii: oza.liczbaOpinii ?? 0,
    }
  }

  if (raw.dekanat_id && typeof raw.dekanat_id === 'object') {
    const dek = raw.dekanat_id
    payload.dekanat_id = omitNull({
      nazwa: dek.nazwa ?? null,
    })
    if (dek.archidiecezja_id && typeof dek.archidiecezja_id === 'object' && dek.archidiecezja_id.nazwa) {
      payload.dekanat_id.archidiecezja_id = {
        nazwa: dek.archidiecezja_id.nazwa,
      }
    }
    if (Object.keys(payload.dekanat_id).length === 0) delete payload.dekanat_id
  }

  if (Array.isArray(raw.cechy_obiektu) && raw.cechy_obiektu.length > 0) {
    payload.cechy_obiektu = raw.cechy_obiektu.map((c) => {
      const item = omitNull({
        darmowyWstep: c.darmowyWstep ?? false,
        dostepPubliczny: c.dostepPubliczny ?? false,
        moznaPalic: c.moznaPalic,
        maksymalnaPojemnosc: c.maksymalnaPojemnosc ?? null,
        obslugaDriveThrough: c.obslugaDriveThrough,
        stronaRezerwacjiWycieczek: c.stronaRezerwacjiWycieczek ?? null,
        kodOddzialu: c.kodOddzialu ?? null,
        globalnyNumerLokalizacyjny: c.globalnyNumerLokalizacyjny ?? null,
        kodISICV4: c.kodISICV4 ?? null,
      })
      return item
    })
  }

  if (Array.isArray(raw.godziny_otwarcia_szczegoly) && raw.godziny_otwarcia_szczegoly.length > 0) {
    payload.godziny_otwarcia_szczegoly = raw.godziny_otwarcia_szczegoly.map((g) => omitNull({
      dzienTygodnia: g.dzienTygodnia ?? null,
      otwarcie: g.otwarcie ?? null,
      zamkniecie: g.zamkniecie ?? null,
      czySpecjalne: g.czySpecjalne ?? false,
    }))
  }

  if (Array.isArray(raw.nabozenstwo) && raw.nabozenstwo.length > 0) {
    payload.nabozenstwo = raw.nabozenstwo.map((n) => omitNull({
      nazwa: n.nazwa ?? null,
      dzienTygodnia: n.dzienTygodnia ?? null,
      godzina: n.godzina ?? null,
      uwagi: n.uwagi ?? null,
    }))
  }

  if (Array.isArray(raw.duchowienstwo) && raw.duchowienstwo.length > 0) {
    payload.duchowienstwo = raw.duchowienstwo.map((d) => omitNull({
      tytul: d.tytul ?? null,
      imie: d.imie ?? null,
      nazwisko: d.nazwisko ?? null,
      rola: d.rola ?? null,
      dodatkowo: d.dodatkowo ?? null,
      kontakt: d.kontakt ?? null,
      dyzurKonfesjonal: d.dyzurKonfesjonal ?? null,
    }))
  }

  if (Array.isArray(raw.wydarzenie) && raw.wydarzenie.length > 0) {
    payload.wydarzenie = raw.wydarzenie.map((w) => omitNull({
      nazwa: w.nazwa ?? null,
      dataRozpoczecia: w.dataRozpoczecia ?? null,
      dataZakonczenia: w.dataZakonczenia ?? null,
    }))
  }

  return payload
}
