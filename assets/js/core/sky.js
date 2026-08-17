/**
 * SKY — login og synkronisering mod Supabase.
 *
 * Fire principper styrer designet:
 *
 *  1. **Appen virker uden.** localStorage er og bliver arbejdskopien. Er der
 *     ingen forbindelse, intet login eller ingen opsætning, fungerer alt som
 *     før — synkroniseringen er et lag ovenpå, ikke en forudsætning.
 *  2. **Nyeste ÆNDRING vinder, post for post.** Ikke nyeste synkronisering.
 *     Hver post bærer det tidspunkt, brugeren rørte den, og det stempel
 *     bevares hele vejen til databasen (se triggeren i 0001_skema.sql).
 *  3. **Sletning er en ændring.** En slettet post får en gravsten i stedet for
 *     at forsvinde. Ellers kan den anden enhed ikke se forskel på "slettet" og
 *     "har aldrig eksisteret", og sender den tilbage ved næste synkronisering.
 *  4. **Ingen post går tabt for at spare et kald.** Sæt flettes uafhængigt af
 *     deres session, og indstillingerne flettes del for del. To enheder, der
 *     retter hver sin ting, mister ingenting.
 *
 * Der bruges ingen SDK. Supabase' REST-API er almindelig HTTP, og det holder
 * projektet fri for både byggetrin og afhængigheder.
 */

import { SKY, skyErOpsat } from '../data/sky-config.js';
import { hent, opdater, STANDARD } from './state.js';
import { harIndhold } from './traening.js';

const NOEGLE_SESSION = 'slankemad:sky-session';
const NOEGLE_NONCE = 'slankemad:sky-nonce';
const NOEGLE_KONTO = 'slankemad:sky-konto';

/* ==================================================================
   LOGIN
================================================================== */

let session = laesSession();

function laesSession() {
  try {
    const raa = localStorage.getItem(NOEGLE_SESSION);
    return raa ? JSON.parse(raa) : null;
  } catch { return null; }
}

function gemSession(s) {
  session = s;
  try {
    if (s) localStorage.setItem(NOEGLE_SESSION, JSON.stringify(s));
    else localStorage.removeItem(NOEGLE_SESSION);
  } catch { /* privat browsing */ }
}

const lokal = (n, v) => {
  try {
    if (v === undefined) return localStorage.getItem(n);
    if (v === null) localStorage.removeItem(n);
    else localStorage.setItem(n, v);
  } catch { /* privat browsing */ }
  return null;
};

export const erLoggetInd = () => Boolean(session?.access_token);
export const brugerEpost = () => session?.user?.email || null;

/**
 * Et login, denne enhed ikke selv har bedt om, er ikke bekræftet endnu.
 * Se `fangLoginFraUrl` for hvorfor.
 */
export const erBekraeftet = () => Boolean(session?.bekraeftet);

const udloebet = () => !session?.expires_at || Date.now() > (session.expires_at * 1000) - 60_000;

async function auth(sti, krop) {
  const svar = await fetch(`${SKY.url}/auth/v1/${sti}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SKY.anonNoegle },
    body: JSON.stringify(krop)
  });
  const data = await svar.json().catch(() => ({}));
  if (!svar.ok) throw new Error(fejltekst(svar.status, data));
  return data;
}

function fejltekst(status, data) {
  const raa = data.error_description || data.msg || data.message || '';
  if (status === 422 && /signup|not allowed/i.test(raa)) {
    return 'Der findes ingen bruger med den adresse. Opret den én gang i Supabase under Authentication → Users.';
  }
  if (status === 429) return 'For mange forsøg lige nu. Prøv igen om et par minutter.';
  return raa || 'Login mislykkedes';
}

const nonce = () => {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map(x => x.toString(16).padStart(2, '0')).join('');
};

/**
 * Sender et engangslink til e-mailen. Ingen adgangskode at glemme.
 *
 * `create_user` er slået fra med vilje: endpointet kan kaldes af hvem som helst
 * med den offentlige anon-nøgle, og med oprettelse slået til kunne en fremmed
 * både fylde brugertabellen op og brænde projektets mailkvote af, så du selv
 * ikke kunne logge ind. Kontoen oprettes én gang i Supabase i stedet.
 */
export async function sendLogin(epost) {
  if (!skyErOpsat()) throw new Error('Synkronisering er ikke sat op');
  const n = nonce();
  lokal(NOEGLE_NONCE, n);
  const retur = `${location.origin}${location.pathname}?login=${n}`;
  // redirect_to er en query-parameter på endpointet. Lagt i body'en bliver den
  // stille ignoreret, og brugeren sendes tilbage til projektets Site URL.
  await auth(`otp?redirect_to=${encodeURIComponent(retur)}`, { email: epost, create_user: false });
  return true;
}

/**
 * Kaldes ved sideindlæsning: fanger tokens fra linket i e-mailen.
 *
 * Et token i adressen er ikke i sig selv et bevis på, at brugeren bad om at
 * logge ind. Alle kan sende et link med deres eget token i, og uden kontrol
 * ville appen tage imod det og synkronisere brugerens data op i den fremmedes
 * konto. Derfor:
 *
 *  - Bad DENNE enhed om linket, ligger vores nonce i adressen. Så er alt godt.
 *  - Ellers tages tokenet imod (magic links åbnes ofte på en anden enhed end
 *    den, der bad om dem), men markeres som ubekræftet. Der synkroniseres ikke
 *    en eneste post, før brugeren har set kontoen og sagt god for den.
 */
export function fangLoginFraUrl() {
  if (!location.hash.includes('access_token')) return false;
  const p = new URLSearchParams(location.hash.slice(1));
  const forventet = lokal(NOEGLE_NONCE);
  const fik = new URLSearchParams(location.search).get('login');
  // Adressen ryddes altid — også når tokenet afvises.
  history.replaceState(null, '', location.pathname);
  lokal(NOEGLE_NONCE, null);

  const access = p.get('access_token');
  if (!access) return false;
  gemSession({
    access_token: access,
    refresh_token: p.get('refresh_token'),
    expires_at: Number(p.get('expires_at')) || Math.floor(Date.now() / 1000) + 3600,
    user: { email: null },
    bekraeftet: Boolean(forventet && fik && forventet === fik)
  });
  return true;
}

/** Brugeren har set e-mailen på skærmen og sagt god for kontoen. */
export function bekraeftKonto() {
  if (!session) return false;
  gemSession({ ...session, bekraeftet: true });
  return true;
}

async function fornyHvisNoedvendigt() {
  if (!session) return false;
  if (!udloebet()) return true;
  if (!session.refresh_token) { gemSession(null); return false; }
  try {
    const ny = await auth('token?grant_type=refresh_token', { refresh_token: session.refresh_token });
    gemSession({ ...session, ...ny, expires_at: ny.expires_at || Math.floor(Date.now() / 1000) + 3600 });
    return true;
  } catch (e) {
    // Et netværksblip er ikke det samme som et ugyldigt token. Smider vi
    // sessionen ved enhver fejl, bliver brugeren logget ud af dårligt wifi.
    if (/nedlukket|network|fetch|Failed/i.test(e.message)) throw e;
    gemSession(null);
    return false;
  }
}

/** Henter brugerens e-mail, så der står noget menneskeligt i grænsefladen. */
export async function hentBruger() {
  if (!(await fornyHvisNoedvendigt())) return null;
  const svar = await fetch(`${SKY.url}/auth/v1/user`, {
    headers: { apikey: SKY.anonNoegle, Authorization: `Bearer ${session.access_token}` }
  });
  if (!svar.ok) return null;
  const bruger = await svar.json();
  gemSession({ ...session, user: { id: bruger.id, email: bruger.email } });
  return bruger;
}

/**
 * Logger ud — også hos Supabase. Uden `scope=global` bliver refresh-tokenet
 * ved med at være gyldigt, og "logget ud" betyder så kun "gemt væk her".
 */
export async function logUd() {
  const t = session?.access_token;
  gemSession(null);
  lokal(NOEGLE_KONTO, null);
  opdater(s => { s.sky = { ...(s.sky || {}), sidsteSync: null }; }, { stille: true });
  if (t && skyErOpsat()) {
    await fetch(`${SKY.url}/auth/v1/logout?scope=global`, {
      method: 'POST',
      headers: { apikey: SKY.anonNoegle, Authorization: `Bearer ${t}` }
    }).catch(() => { /* vi er logget ud lokalt uanset hvad */ });
  }
}

/* ==================================================================
   DATABASEKALD
================================================================== */

const q = o => new URLSearchParams(o).toString();

async function db(sti, { metode = 'GET', krop, prefer } = {}) {
  if (!(await fornyHvisNoedvendigt())) throw new Error('Du er logget ud');
  const svar = await fetch(`${SKY.url}/rest/v1/${sti}`, {
    method: metode,
    headers: {
      apikey: SKY.anonNoegle,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: krop ? JSON.stringify(krop) : undefined
  });
  if (!svar.ok) {
    const tekst = await svar.text().catch(() => '');
    throw new Error(`Databasen svarede ${svar.status}: ${tekst.slice(0, 200)}`);
  }
  if (svar.status === 204) return null;
  return svar.json().catch(() => null);
}

const hentRaekker = (tabel, bruger) =>
  db(`${tabel}?${q({ bruger: `eq.${bruger}`, select: '*' })}`).then(r => r || []);

const skriv = (tabel, konflikt, raekker, medSvar = false) =>
  db(`${tabel}?${q({ on_conflict: konflikt })}`, {
    metode: 'POST',
    krop: raekker,
    prefer: `resolution=merge-duplicates${medSvar ? ',return=representation' : ''}`
  });

const brugerId = () => session?.user?.id;

/* ==================================================================
   TID
================================================================== */

const nu = () => new Date().toISOString();

/**
 * Millisekunder, eller null hvis stemplet mangler eller er vrøvl.
 * Serveren leverer `2026-08-16T10:00:00.123456+00:00`, klienten
 * `2026-08-16T10:00:00.123Z` — de kan ikke sammenlignes som tekst.
 */
const tid = v => {
  const n = v ? Date.parse(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

const nyere = (a, b) => {
  const x = tid(a), y = tid(b);
  if (x === null) return false;
  if (y === null) return true;
  return x > y;
};

/* ==================================================================
   FLETNING
================================================================== */

/**
 * Fletter to lister nøgle for nøgle efter nyeste ændring.
 *
 * En lokal post uden stempel har ukendt alder — den er typisk gemt, før
 * synkroniseringen fandtes. Den taber aldrig og bliver stemplet nu og sendt op.
 * Uden den regel ville serverens tomme udgave overskrive den.
 *
 * Eksporteret, fordi det er reglen, alt andet hviler på — den skal kunne testes
 * direkte.
 */
export function flet(lokale, fjerne, noegle, fraRaekke, stempelNu = nu()) {
  const l = new Map(lokale.map(x => [noegle(x), x]));
  const f = new Map(fjerne.map(x => [noegle(fraRaekke(x)), x]));
  const resultat = [], send = [], hentet = [];

  for (const k of new Set([...l.keys(), ...f.keys()])) {
    const lok = l.get(k);
    const fje = f.get(k);

    if (!lok) {
      const ny = fraRaekke(fje);
      resultat.push(ny);
      hentet.push(ny);
    } else if (tid(lok.opdateret) === null) {
      const ny = { ...lok, opdateret: stempelNu };
      resultat.push(ny);
      send.push(ny);
    } else if (fje && nyere(fje.opdateret, lok.opdateret)) {
      const ny = fraRaekke(fje);
      resultat.push(ny);
      hentet.push(ny);
    } else if (!fje || nyere(lok.opdateret, fje.opdateret)) {
      resultat.push(lok);
      send.push(lok);
    } else {
      resultat.push(lok);      // lige gamle — ingen grund til at røre noget
    }
  }
  return { resultat, send, hentet };
}

/**
 * Lægger flettede poster tilbage i tilstanden UDEN at træde på det, brugeren
 * har nået at registrere, mens synkroniseringen kørte.
 *
 * Synkroniseringen kan tage sekunder på dårligt net, og appen er brugbar hele
 * tiden. Skrev vi bare resultatet oven i, ville en træning registreret midt i
 * det hele forsvinde uden spor.
 */
function anvend(nuvaerende, resultat, noegle, foer) {
  const foerStempel = new Map(foer.map(x => [noegle(x), x.opdateret ?? null]));
  const ud = new Map(nuvaerende.map(x => [noegle(x), x]));
  for (const r of resultat) {
    const k = noegle(r);
    const nuv = ud.get(k);
    if (nuv) {
      // Tilføjet undervejs, eller ændret undervejs? Så er det brugerens nyeste.
      if (!foerStempel.has(k)) continue;
      if ((nuv.opdateret ?? null) !== foerStempel.get(k)) continue;
    }
    ud.set(k, r);
  }
  return [...ud.values()];
}

/** Lille checksum. Bruges til at se, om en del af indstillingerne er ændret her. */
function checksum(o) {
  const tekst = JSON.stringify(o ?? null);
  let h = 2166136261;
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/* ==================================================================
   INDSTILLINGER — ét dokument, men flettet del for del

   Hele dokumentet som én enhed betød, at den enhed, der synkroniserede sidst,
   tavst mistede alt, den havde lavet — også de dele, ingen andre havde rørt.
   Delene her er uafhængige af hinanden, så en madplan lavet på telefonen og en
   målvægt rettet på computeren kan begge overleve.
================================================================== */

const DELE = {
  profil: {
    laes: t => t.profil,
    skriv: (s, v) => { if (v && typeof v === 'object') s.profil = { ...s.profil, ...v }; }
  },
  valg: {
    laes: t => t.valg,
    skriv: (s, v) => { if (v && typeof v === 'object') s.valg = { ...s.valg, ...v }; }
  },
  favoritter: {
    laes: t => t.favoritter,
    skriv: (s, v) => { if (Array.isArray(v)) s.favoritter = v; }
  },
  fravalgte: {
    laes: t => t.fravalgte,
    skriv: (s, v) => { if (Array.isArray(v)) s.fravalgte = v; }
  },
  plan: {
    laes: t => t.plan,
    skriv: (s, v) => { s.plan = v ?? null; }
  },
  gemtePlaner: {
    laes: t => t.gemtePlaner,
    skriv: (s, v) => { if (Array.isArray(v)) s.gemtePlaner = v; }
  },
  koeb: {
    laes: t => t.koeb,
    skriv: (s, v) => { if (v && typeof v === 'object') s.koeb = v; }
  },
  niveauer: {
    laes: t => t.traening?.niveauer || {},
    skriv: (s, v) => { if (v && typeof v === 'object') s.traening.niveauer = v; }
  },
  accepteret: {
    laes: t => t.traening?.accepteret || {},
    skriv: (s, v) => { if (v && typeof v === 'object') s.traening.accepteret = v; }
  },
  sidsteSektion: {
    laes: t => t.sidsteSektion,
    skriv: (s, v) => { if (v === 'mad' || v === 'traening') s.sidsteSektion = v; }
  }
};

/* ==================================================================
   SYNKRONISERING
================================================================== */

let koerer = null;

/**
 * Kører en fuld synkronisering: henter serverens rækker, fletter dem sammen
 * med de lokale post for post, og skriver resultatet tilbage begge veje.
 * To samtidige kald bliver til ét — app.js starter en i baggrunden, og
 * brugeren kan trykke på knappen samtidig.
 *
 * @returns {Promise<{op:number, ned:number, konflikt:string[]}>}
 */
export function synkroniser() {
  if (koerer) return koerer;
  koerer = koerSynk().finally(() => { koerer = null; });
  return koerer;
}

async function koerSynk() {
  if (!skyErOpsat() || !erLoggetInd()) return { op: 0, ned: 0, konflikt: [] };
  if (!erBekraeftet()) throw new Error('Bekræft kontoen under Mig, før der synkroniseres');
  if (!brugerId()) await hentBruger();
  const bruger = brugerId();
  if (!bruger) throw new Error('Kunne ikke bestemme brugeren');

  // De lokale data hører til én konto. Uden den her binding ville et login med
  // en anden konto på samme browser sende den forrige brugers målinger op i den
  // nye konto ved første synkronisering.
  const bundet = lokal(NOEGLE_KONTO);
  if (bundet && bundet !== bruger) {
    throw new Error('De data, der ligger i browseren, hører til en anden konto. Nulstil under Mig, eller log ind som den rigtige bruger.');
  }

  const stempelNu = nu();
  const foer = hent();
  let op = 0, ned = 0;
  const konflikt = [];

  /* ---------- Indstillinger, del for del ---------- */
  const fjernDok = (await hentRaekker('offentlig_indstillinger', bruger))[0];
  const fjernDele = fjernDok?.data?.dele || {};
  const kendte = foer.sky?.dele || {};

  const nyeDele = {};        // det, der skal stå på serveren bagefter
  const hentDele = {};       // det, der skal skrives ned i den lokale tilstand
  const foerSum = {};        // så vi kan se, om brugeren ændrer noget undervejs
  let skalSkrives = false;

  for (const [navn, del] of Object.entries(DELE)) {
    const lokalV = del.laes(foer);
    const sum = checksum(lokalV);
    foerSum[navn] = sum;
    const kendt = kendte[navn];
    // Har enheden aldrig synkroniseret denne del, tæller den kun som "ændret
    // her", hvis den faktisk er rørt. Ellers ville en frisk telefon melde alle
    // sine standardværdier ind som nye og slette det, computeren har lavet.
    const aendretHer = kendt ? kendt.sum !== sum : sum !== checksum(del.laes(STANDARD));
    const lokalT = aendretHer ? stempelNu : (kendt?.t || null);
    const fjern = fjernDele[navn];

    if (fjern && nyere(fjern.t, lokalT)) {
      hentDele[navn] = { v: fjern.v, t: fjern.t };
      nyeDele[navn] = { v: fjern.v, t: fjern.t };
    } else {
      nyeDele[navn] = { v: lokalV ?? null, t: lokalT || stempelNu };
      if (aendretHer || !fjern) skalSkrives = true;
      // Begge sider har rettet den samme del siden sidst. Denne enheds version
      // er den, brugeren lige har lavet — den vinder, men det bliver sagt højt.
      if (aendretHer && fjern && kendt && nyere(fjern.t, kendt.t)) konflikt.push(navn);
    }
  }

  if (skalSkrives) {
    await skriv('offentlig_indstillinger', 'bruger', [{ bruger, data: { dele: nyeDele } }]);
    op++;
  }
  ned += Object.keys(hentDele).length;

  /* ---------- Træningssessioner ---------- */
  const fjernSessioner = await hentRaekker('traening_session', bruger);
  const fjernSaetRaekker = await hentRaekker('traening_saet', bruger);

  const alleLokale = foer.traening?.sessioner || [];
  // En tom, urørt session er ikke data. Den bliver liggende lokalt, men den
  // skal hverken sendes op eller kunne vinde over en rigtig registrering.
  const lokaleSessioner = alleLokale.filter(s => Boolean(s.opdateret) || harIndhold(s));

  const sessFlet = flet(lokaleSessioner, fjernSessioner, s => s.dato, fraSessionRaekke, stempelNu);

  const idEfterDato = new Map(fjernSessioner.map(r => [r.dato, r.id]));
  if (sessFlet.send.length) {
    const svar = await skriv('traening_session', 'bruger,dato',
      sessFlet.send.map(s => tilSessionRaekke(s, bruger)), true) || [];
    for (const r of svar) idEfterDato.set(r.dato, r.id);
    op += sessFlet.send.length;
  }

  /* ---------- Sæt: flettes for sig, ikke sammen med sessionen ----------
     Slettes og genindsættes sættene sammen med sessionen, kan én afbrudt
     forbindelse — eller ét klik på "planlagt" fra en anden enhed — udslette en
     hel registreret træning. Hvert sæt har derfor sit eget stempel. */
  const datoForFjernId = new Map(fjernSessioner.map(r => [r.id, r.dato]));
  const fjernSaetEfterDato = new Map();
  for (const r of fjernSaetRaekker) {
    const d = datoForFjernId.get(r.session_id);
    if (!d) continue;
    if (!fjernSaetEfterDato.has(d)) fjernSaetEfterDato.set(d, []);
    fjernSaetEfterDato.get(d).push(r);
  }

  const lokalSaetEfterDato = new Map(lokaleSessioner.map(s => [s.dato, s.saet || []]));
  const saetNoegle = x => `${x.oevelseId}:${x.saetNr}`;
  const saetTilSend = [];

  const flettedeSessioner = sessFlet.resultat.map(sess => {
    const r = flet(
      lokalSaetEfterDato.get(sess.dato) || [],
      fjernSaetEfterDato.get(sess.dato) || [],
      saetNoegle, fraSaetRaekke, stempelNu
    );
    ned += r.hentet.length;
    const sessionId = idEfterDato.get(sess.dato);
    if (sessionId) for (const x of r.send) saetTilSend.push(tilSaetRaekke(x, sessionId, bruger));
    return { ...sess, saet: r.resultat.sort((a, b) =>
      a.oevelseId.localeCompare(b.oevelseId) || a.saetNr - b.saetNr) };
  });

  if (saetTilSend.length) {
    await skriv('traening_saet', 'session_id,oevelse_id,saet_nr', saetTilSend);
    op += saetTilSend.length;
  }
  ned += sessFlet.hentet.length;

  /* ---------- Gåture ---------- */
  const fjernGaature = await hentRaekker('gaatur', bruger);
  const gaaFlet = flet(foer.traening?.gaature || [], fjernGaature, g => g.dato, fraGaaturRaekke, stempelNu);
  if (gaaFlet.send.length) {
    await skriv('gaatur', 'bruger,dato', gaaFlet.send.map(g => ({
      bruger, dato: g.dato,
      minutter: Number.isFinite(g.minutter) ? g.minutter : null,
      note: g.note || null,
      slettet: g.slettet || null,
      opdateret: g.opdateret
    })));
    op += gaaFlet.send.length;
  }
  ned += gaaFlet.hentet.length;

  /* ---------- Målinger ---------- */
  const fjernMaalinger = await hentRaekker('maaling', bruger);
  const maalFlet = flet(foer.log || [], fjernMaalinger, m => m.dato, fraMaalingRaekke, stempelNu);
  if (maalFlet.send.length) {
    await skriv('maaling', 'bruger,dato', maalFlet.send.map(m => ({
      bruger, dato: m.dato,
      vaegt: m.vaegt ?? null, talje: m.talje ?? null,
      slettet: m.slettet || null,
      opdateret: m.opdateret
    })));
    op += maalFlet.send.length;
  }
  ned += maalFlet.hentet.length;

  /* ---------- Tilbage i tilstanden ---------- */
  lokal(NOEGLE_KONTO, bruger);
  opdater(s => {
    // Rørte brugeren en del, mens vi hentede? Så er det brugerens, der gælder.
    // Delen bogføres slet ikke, så den bliver sendt op ved næste synkronisering.
    const roert = new Set(Object.keys(DELE).filter(n => checksum(DELE[n].laes(s)) !== foerSum[n]));
    for (const [navn, v] of Object.entries(hentDele)) {
      if (!roert.has(navn)) DELE[navn].skriv(s, v.v);
    }
    s.traening.sessioner = anvend(s.traening?.sessioner || [], flettedeSessioner, x => x.dato, alleLokale)
      .sort((a, b) => a.dato.localeCompare(b.dato));
    s.traening.gaature = anvend(s.traening?.gaature || [], gaaFlet.resultat, x => x.dato, foer.traening?.gaature || [])
      .sort((a, b) => a.dato.localeCompare(b.dato));
    s.log = anvend(s.log || [], maalFlet.resultat, x => x.dato, foer.log || [])
      .sort((a, b) => a.dato.localeCompare(b.dato));

    const dele = {};
    for (const navn of Object.keys(DELE)) {
      if (roert.has(navn)) continue;
      const t = nyeDele[navn]?.t || kendte[navn]?.t || null;
      if (t) dele[navn] = { sum: checksum(DELE[navn].laes(s)), t };
    }
    s.sky = { ...(s.sky || {}), sidsteSync: nu(), dele };
  });

  return { op, ned, konflikt };
}

/**
 * Sletter alt i skyen — som gravsten, ikke som fravær, så andre enheder også
 * får sletningen at vide i stedet for at sende det hele op igen.
 */
export async function sletAltISkyen() {
  if (!skyErOpsat() || !erLoggetInd()) return 0;
  const bruger = brugerId() || (await hentBruger())?.id;
  if (!bruger) throw new Error('Kunne ikke bestemme brugeren');
  const stempel = nu();
  let antal = 0;

  const sessioner = await hentRaekker('traening_session', bruger);
  const saet = await hentRaekker('traening_saet', bruger);
  const gaature = await hentRaekker('gaatur', bruger);
  const maalinger = await hentRaekker('maaling', bruger);

  if (saet.length) {
    await skriv('traening_saet', 'session_id,oevelse_id,saet_nr', saet.map(r => ({
      session_id: r.session_id, bruger, oevelse_id: r.oevelse_id, saet_nr: r.saet_nr,
      gentagelser: null, vaegt: null, sekunder: null, slettet: stempel, opdateret: stempel
    })));
    antal += saet.length;
  }
  if (sessioner.length) {
    await skriv('traening_session', 'bruger,dato', sessioner.map(r => ({
      bruger, dato: r.dato, status: 'planlagt', slettet: stempel, opdateret: stempel
    })));
    antal += sessioner.length;
  }
  if (gaature.length) {
    await skriv('gaatur', 'bruger,dato', gaature.map(r => ({
      bruger, dato: r.dato, minutter: null, note: null, slettet: stempel, opdateret: stempel
    })));
    antal += gaature.length;
  }
  if (maalinger.length) {
    await skriv('maaling', 'bruger,dato', maalinger.map(r => ({
      bruger, dato: r.dato, vaegt: null, talje: null, slettet: stempel, opdateret: stempel
    })));
    antal += maalinger.length;
  }
  // Indstillingsdokumentet tømmes helt. Uden det ville profilen og madplanen
  // blive hentet ned igen ved næste synkronisering.
  await skriv('offentlig_indstillinger', 'bruger', [{ bruger, data: { dele: {} } }]);
  return antal;
}

/* ==================================================================
   RÆKKE ↔ POST
================================================================== */

function tilSessionRaekke(s, bruger) {
  return {
    bruger,
    dato: s.dato,
    skabelon_id: s.skabelonId || null,
    status: s.status,
    startet: s.startet || null,
    sluttet: s.sluttet || null,
    varighed: Number.isFinite(s.varighed) ? s.varighed : null,
    intensitet: s.intensitet || null,
    intervaller: Number.isFinite(s.intervaller) ? s.intervaller : null,
    note: s.note || null,
    vaegte: s.vaegte || {},
    snapshot: s.snapshot || null,
    slettet: s.slettet || null,
    opdateret: s.opdateret
  };
}

function fraSessionRaekke(r) {
  return {
    id: `s-${r.dato}`,
    dato: r.dato,
    skabelonId: r.skabelon_id,
    status: r.status,
    startet: r.startet,
    sluttet: r.sluttet,
    varighed: r.varighed,
    intensitet: r.intensitet,
    intervaller: r.intervaller,
    note: r.note || '',
    vaegte: r.vaegte || {},
    snapshot: r.snapshot,
    saet: [],
    ...(r.slettet ? { slettet: r.slettet } : {}),
    opdateret: r.opdateret
  };
}

function tilSaetRaekke(x, sessionId, bruger) {
  return {
    session_id: sessionId,
    bruger,
    oevelse_id: x.oevelseId,
    saet_nr: x.saetNr,
    gentagelser: Number.isFinite(x.gentagelser) ? x.gentagelser : null,
    vaegt: Number.isFinite(x.vaegt) ? x.vaegt : null,
    sekunder: Number.isFinite(x.sekunder) ? x.sekunder : null,
    slettet: x.slettet || null,
    opdateret: x.opdateret
  };
}

function fraSaetRaekke(r) {
  return {
    oevelseId: r.oevelse_id,
    saetNr: r.saet_nr,
    ...(r.gentagelser != null ? { gentagelser: Number(r.gentagelser) } : {}),
    ...(r.vaegt != null ? { vaegt: Number(r.vaegt) } : {}),
    ...(r.sekunder != null ? { sekunder: Number(r.sekunder) } : {}),
    ...(r.slettet ? { slettet: r.slettet } : {}),
    opdateret: r.opdateret
  };
}

const fraGaaturRaekke = r => ({
  dato: r.dato,
  minutter: r.minutter == null ? null : Number(r.minutter),
  note: r.note || '',
  ...(r.slettet ? { slettet: r.slettet } : {}),
  opdateret: r.opdateret
});

const fraMaalingRaekke = r => ({
  dato: r.dato,
  vaegt: r.vaegt == null ? null : Number(r.vaegt),
  talje: r.talje == null ? null : Number(r.talje),
  ...(r.slettet ? { slettet: r.slettet } : {}),
  opdateret: r.opdateret
});

/** Status til grænsefladen. */
export function status() {
  const t = hent();
  return {
    opsat: skyErOpsat(),
    loggetInd: erLoggetInd(),
    bekraeftet: erBekraeftet(),
    epost: brugerEpost(),
    sidsteSync: t.sky?.sidsteSync || null
  };
}
