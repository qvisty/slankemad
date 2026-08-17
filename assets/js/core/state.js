/**
 * BRUGERTILSTAND
 *
 * Ét sted til alt, appen husker: profil, indstillinger, favoritter, den
 * aktuelle plan, gemte planer og målinger.
 *
 * Lagringen ligger bag et lille interface (`hent`, `opdater`, `abonner`), så
 * localStorage senere kan skiftes ud med et API uden at UI'et ændres.
 */

const NOEGLE = 'slankemad:v2';

export const STANDARD = Object.freeze({
  version: 2,
  profil: {
    koen: 'mand',
    alder: 42,
    hojde: 182,
    vaegt: 92,
    maalvaegt: 84,
    aktivitet: 1.35,
    traening: 3,
    tempo: 0.5
  },
  valg: {
    personer: 2,
    dage: 7,
    morgenmad: true,
    frokost: true,
    aftensmad: true,
    snacks: 1,
    maxTid: 30,
    undgaa: [],
    rester: true,
    udeMorgenmad: false,   // morgenmad i hverdagen spises ude (kantine/buffet)
    udeFrokost: false,     // frokost i hverdagen spises ude
    fleksAften: true,
    fleksDag: 4,
    fasteVarer: false
  },
  favoritter: [],
  fravalgte: [],
  plan: null,
  gemtePlaner: [],
  koeb: {},
  log: [],
  onboardet: false
});

let tilstand = laes();
const lyttere = new Set();

function laes() {
  try {
    const raa = localStorage.getItem(NOEGLE);
    if (!raa) return flet(STANDARD, {});
    return flet(STANDARD, JSON.parse(raa));
  } catch {
    return flet(STANDARD, {});
  }
}

function flet(standard, gemt) {
  return {
    version: 2,
    profil: { ...standard.profil, ...(gemt.profil || {}) },
    valg: { ...standard.valg, ...(gemt.valg || {}) },
    favoritter: Array.isArray(gemt.favoritter) ? gemt.favoritter : [],
    fravalgte: Array.isArray(gemt.fravalgte) ? gemt.fravalgte : [],
    plan: gemt.plan || null,
    gemtePlaner: Array.isArray(gemt.gemtePlaner) ? gemt.gemtePlaner : [],
    koeb: gemt.koeb && typeof gemt.koeb === 'object' ? gemt.koeb : {},
    log: Array.isArray(gemt.log) ? gemt.log : [],
    onboardet: !!gemt.onboardet
  };
}

function skriv() {
  try {
    localStorage.setItem(NOEGLE, JSON.stringify(tilstand));
  } catch {
    /* privat browsing eller fuldt lager — appen kører videre uden at gemme */
  }
}

/** Læs den aktuelle tilstand. Behandl den som read-only. */
export const hent = () => tilstand;

/**
 * Opdatér tilstanden. `aendring` er enten et objekt, der flettes ind på
 * øverste niveau, eller en funktion, der muterer en kopi.
 */
export function opdater(aendring, { stille = false } = {}) {
  if (typeof aendring === 'function') aendring(tilstand);
  else Object.assign(tilstand, aendring);
  skriv();
  if (!stille) lyttere.forEach(fn => fn(tilstand));
  return tilstand;
}

export function abonner(fn) {
  lyttere.add(fn);
  return () => lyttere.delete(fn);
}

export function nulstil() {
  try { localStorage.removeItem(NOEGLE); } catch { /* ignoreres */ }
  tilstand = flet(STANDARD, {});
  lyttere.forEach(fn => fn(tilstand));
}

/* ---------- Favoritter ---------- */
export const erFavorit = id => tilstand.favoritter.includes(id);

export function skiftFavorit(id) {
  const f = tilstand.favoritter;
  opdater(s => {
    s.favoritter = f.includes(id) ? f.filter(x => x !== id) : [...f, id];
  });
  return erFavorit(id);
}

/** Retter, brugeren har fravalgt — de dukker ikke op i nye planer. */
export const erFravalgt = id => tilstand.fravalgte.includes(id);

export function skiftFravalg(id) {
  const f = tilstand.fravalgte;
  opdater(s => {
    s.fravalgte = f.includes(id) ? f.filter(x => x !== id) : [...f, id];
  });
  return erFravalgt(id);
}

/* ---------- Gemte planer ---------- */
export function gemPlan(navn) {
  if (!tilstand.plan) return null;
  const post = {
    id: `p${Date.now()}`,
    navn: navn || `Uge ${new Date().toLocaleDateString('da-DK')}`,
    dato: new Date().toISOString(),
    plan: structuredClone(tilstand.plan)
  };
  opdater(s => { s.gemtePlaner = [post, ...s.gemtePlaner].slice(0, 20); });
  return post;
}

export function hentGemtPlan(id) {
  const post = tilstand.gemtePlaner.find(p => p.id === id);
  if (!post) return false;
  opdater(s => { s.plan = structuredClone(post.plan); s.koeb = {}; });
  return true;
}

export function sletGemtPlan(id) {
  opdater(s => { s.gemtePlaner = s.gemtePlaner.filter(p => p.id !== id); });
}
