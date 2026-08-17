/**
 * SKY — login og synkronisering mod Supabase.
 *
 * To principper styrer designet:
 *
 *  1. **Appen virker uden.** localStorage er og bliver arbejdskopien. Er der
 *     ingen forbindelse, intet login eller ingen opsætning, fungerer alt som
 *     før — synkroniseringen er et lag ovenpå, ikke en forudsætning.
 *  2. **Nyeste ændring vinder, række for række.** Hver post har et
 *     `opdateret`-tidsstempel. Ved synkronisering sammenlignes lokalt og
 *     serverens stempel pr. post, og den nyeste vinder. Det er forudsigeligt,
 *     og det er godt nok, når det er én person med to enheder.
 *
 * Der bruges ingen SDK. Supabase' REST-API er almindelig HTTP, og det holder
 * projektet fri for både byggetrin og afhængigheder.
 */

import { SKY, skyErOpsat } from '../data/sky-config.js';
import { hent, opdater } from './state.js';

const NOEGLE_SESSION = 'slankemad:sky-session';

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

export const erLoggetInd = () => Boolean(session?.access_token);
export const brugerEpost = () => session?.user?.email || null;

const udloebet = () => !session?.expires_at || Date.now() > (session.expires_at * 1000) - 60_000;

async function auth(sti, krop) {
  const svar = await fetch(`${SKY.url}/auth/v1/${sti}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SKY.anonNoegle },
    body: JSON.stringify(krop)
  });
  const data = await svar.json().catch(() => ({}));
  if (!svar.ok) throw new Error(data.error_description || data.msg || data.message || 'Login mislykkedes');
  return data;
}

/** Sender et engangslink til e-mailen. Ingen adgangskode at glemme. */
export async function sendLogin(epost) {
  if (!skyErOpsat()) throw new Error('Synkronisering er ikke sat op');
  const retur = `${location.origin}${location.pathname}`;
  await auth('otp', { email: epost, create_user: true, options: { email_redirect_to: retur } });
  return true;
}

/** Kaldes ved sideindlæsning: fanger tokens fra linket i e-mailen. */
export function fangLoginFraUrl() {
  if (!location.hash.includes('access_token')) return false;
  const p = new URLSearchParams(location.hash.slice(1));
  const access = p.get('access_token');
  const refresh = p.get('refresh_token');
  if (!access) return false;
  gemSession({
    access_token: access,
    refresh_token: refresh,
    expires_at: Number(p.get('expires_at')) || Math.floor(Date.now() / 1000) + 3600,
    user: { email: null }
  });
  history.replaceState(null, '', `${location.pathname}${location.search}`);
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
  } catch {
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

export function logUd() {
  gemSession(null);
  opdater(t => { t.sky = { ...(t.sky || {}), sidsteSync: null }; }, { stille: true });
}

/* ==================================================================
   DATABASEKALD
================================================================== */

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

const brugerId = () => session?.user?.id;

/* ==================================================================
   SYNKRONISERING
   Alt er lille nok til at kunne synkroniseres samlet. Det er langt nemmere
   at gennemskue end delvis synkronisering — og med én bruger og et par
   hundrede rækker om året er der ingen grund til andet.
================================================================== */

const nu = () => new Date().toISOString();

/** Sammenligner to tidsstempler; tomme regnes som ældst. */
const nyere = (a, b) => (a || '') > (b || '');

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
    opdateret: s.opdateret || nu()
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
    opdateret: r.opdateret,
    fjernId: r.id
  };
}

/**
 * Kører en fuld synkronisering: henter serverens rækker, fletter dem sammen
 * med de lokale efter tidsstempel, og skriver resultatet tilbage begge veje.
 * @returns {Promise<{op:number, ned:number}>} antal poster sendt og hentet
 */
export async function synkroniser() {
  if (!skyErOpsat() || !erLoggetInd()) return { op: 0, ned: 0 };
  if (!brugerId()) await hentBruger();
  const bruger = brugerId();
  if (!bruger) throw new Error('Kunne ikke bestemme brugeren');

  const t = hent();
  let op = 0, ned = 0;

  /* ---------- Indstillinger: ét dokument, nyeste vinder ---------- */
  const lokalIndstillinger = {
    profil: t.profil, valg: t.valg, favoritter: t.favoritter, fravalgte: t.fravalgte,
    plan: t.plan, gemtePlaner: t.gemtePlaner, koeb: t.koeb,
    niveauer: t.traening?.niveauer || {}, accepteret: t.traening?.accepteret || {},
    sidsteSektion: t.sidsteSektion
  };
  const fjernIndstillinger = (await db(`offentlig_indstillinger?bruger=eq.${bruger}&select=*`))?.[0];
  const lokalStempel = t.sky?.indstillingerOpdateret || '';

  if (fjernIndstillinger && nyere(fjernIndstillinger.opdateret, lokalStempel)) {
    const d = fjernIndstillinger.data || {};
    opdater(s => {
      if (d.profil) s.profil = { ...s.profil, ...d.profil };
      if (d.valg) s.valg = { ...s.valg, ...d.valg };
      if (Array.isArray(d.favoritter)) s.favoritter = d.favoritter;
      if (Array.isArray(d.fravalgte)) s.fravalgte = d.fravalgte;
      if (d.plan !== undefined) s.plan = d.plan;
      if (Array.isArray(d.gemtePlaner)) s.gemtePlaner = d.gemtePlaner;
      if (d.koeb) s.koeb = d.koeb;
      if (d.niveauer) s.traening.niveauer = d.niveauer;
      if (d.accepteret) s.traening.accepteret = d.accepteret;
      s.sky = { ...(s.sky || {}), indstillingerOpdateret: fjernIndstillinger.opdateret };
    }, { stille: true });
    ned++;
  } else {
    const svar = await db('offentlig_indstillinger?on_conflict=bruger', {
      metode: 'POST',
      krop: [{ bruger, data: lokalIndstillinger }],
      prefer: 'resolution=merge-duplicates,return=representation'
    });
    opdater(s => {
      s.sky = { ...(s.sky || {}), indstillingerOpdateret: svar?.[0]?.opdateret || nu() };
    }, { stille: true });
    op++;
  }

  /* ---------- Træningssessioner og sæt ---------- */
  const fjernSessioner = await db(`traening_session?bruger=eq.${bruger}&select=*`) || [];
  const fjernSaet = await db(`traening_saet?bruger=eq.${bruger}&select=*`) || [];
  const lokaleSessioner = hent().traening?.sessioner || [];

  const fjernEfterDato = new Map(fjernSessioner.map(r => [r.dato, r]));
  const lokalEfterDato = new Map(lokaleSessioner.map(s => [s.dato, s]));
  const alleDatoer = new Set([...fjernEfterDato.keys(), ...lokalEfterDato.keys()]);

  const skalSendes = [];
  const flettede = [];

  for (const dato of alleDatoer) {
    const lokal = lokalEfterDato.get(dato);
    const fjern = fjernEfterDato.get(dato);

    if (fjern && (!lokal || nyere(fjern.opdateret, lokal.opdateret))) {
      const ny = fraSessionRaekke(fjern);
      ny.saet = fjernSaet
        .filter(x => x.session_id === fjern.id)
        .map(x => ({
          oevelseId: x.oevelse_id,
          saetNr: x.saet_nr,
          ...(x.gentagelser != null ? { gentagelser: Number(x.gentagelser) } : {}),
          ...(x.vaegt != null ? { vaegt: Number(x.vaegt) } : {}),
          ...(x.sekunder != null ? { sekunder: Number(x.sekunder) } : {})
        }));
      flettede.push(ny);
      ned++;
    } else if (lokal) {
      flettede.push(lokal);
      if (!fjern || nyere(lokal.opdateret, fjern.opdateret)) skalSendes.push(lokal);
    }
  }

  if (skalSendes.length) {
    const raekker = await db('traening_session?on_conflict=bruger,dato', {
      metode: 'POST',
      krop: skalSendes.map(s => tilSessionRaekke(s, bruger)),
      prefer: 'resolution=merge-duplicates,return=representation'
    }) || [];
    op += skalSendes.length;

    const idEfterDato = new Map(raekker.map(r => [r.dato, r.id]));
    const saetRaekker = [];
    for (const s of skalSendes) {
      const sessionId = idEfterDato.get(s.dato) || fjernEfterDato.get(s.dato)?.id;
      if (!sessionId) continue;
      // Sættene erstattes helt for den session, så slettede sæt også forsvinder.
      await db(`traening_saet?session_id=eq.${sessionId}`, { metode: 'DELETE' });
      for (const x of s.saet || []) {
        saetRaekker.push({
          session_id: sessionId, bruger,
          oevelse_id: x.oevelseId, saet_nr: x.saetNr,
          gentagelser: Number.isFinite(x.gentagelser) ? x.gentagelser : null,
          vaegt: Number.isFinite(x.vaegt) ? x.vaegt : null,
          sekunder: Number.isFinite(x.sekunder) ? x.sekunder : null
        });
      }
    }
    if (saetRaekker.length) {
      await db('traening_saet?on_conflict=session_id,oevelse_id,saet_nr', {
        metode: 'POST', krop: saetRaekker, prefer: 'resolution=merge-duplicates'
      });
    }
  }

  /* ---------- Gåture ---------- */
  const fjernGaature = await db(`gaatur?bruger=eq.${bruger}&select=*`) || [];
  const lokaleGaature = hent().traening?.gaature || [];
  const gaaFlettet = flet(lokaleGaature, fjernGaature, g => g.dato,
    r => ({ dato: r.dato, minutter: r.minutter, note: r.note || '', opdateret: r.opdateret }));
  ned += gaaFlettet.hentet.length;
  if (gaaFlettet.send.length) {
    await db('gaatur?on_conflict=bruger,dato', {
      metode: 'POST',
      krop: gaaFlettet.send.map(g => ({
        bruger, dato: g.dato, minutter: g.minutter, note: g.note || null, opdateret: g.opdateret || nu()
      })),
      prefer: 'resolution=merge-duplicates'
    });
    op += gaaFlettet.send.length;
  }

  /* ---------- Målinger ---------- */
  const fjernMaalinger = await db(`maaling?bruger=eq.${bruger}&select=*`) || [];
  const lokaleMaalinger = hent().log || [];
  const maalFlettet = flet(lokaleMaalinger, fjernMaalinger, m => m.dato,
    r => ({ dato: r.dato, vaegt: r.vaegt == null ? null : Number(r.vaegt),
            talje: r.talje == null ? null : Number(r.talje), opdateret: r.opdateret }));
  ned += maalFlettet.hentet.length;
  if (maalFlettet.send.length) {
    await db('maaling?on_conflict=bruger,dato', {
      metode: 'POST',
      krop: maalFlettet.send.map(m => ({
        bruger, dato: m.dato, vaegt: m.vaegt, talje: m.talje, opdateret: m.opdateret || nu()
      })),
      prefer: 'resolution=merge-duplicates'
    });
    op += maalFlettet.send.length;
  }

  opdater(s => {
    s.traening.sessioner = flettede.sort((a, b) => a.dato.localeCompare(b.dato));
    s.traening.gaature = gaaFlettet.resultat.sort((a, b) => a.dato.localeCompare(b.dato));
    s.log = maalFlettet.resultat.sort((a, b) => a.dato.localeCompare(b.dato));
    s.sky = { ...(s.sky || {}), sidsteSync: nu() };
  });

  return { op, ned };
}

/** Fletter to lister nøgle for nøgle efter nyeste tidsstempel. Eksporteret for test. */
export function flet(lokale, fjerne, noegle, fraRaekke) {
  const l = new Map(lokale.map(x => [noegle(x), x]));
  const f = new Map(fjerne.map(x => [x.dato, x]));
  const resultat = [];
  const send = [];
  const hentet = [];

  for (const k of new Set([...l.keys(), ...f.keys()])) {
    const lok = l.get(k);
    const fje = f.get(k);
    if (fje && (!lok || nyere(fje.opdateret, lok.opdateret))) {
      const ny = fraRaekke(fje);
      resultat.push(ny);
      hentet.push(ny);
    } else if (lok) {
      resultat.push(lok);
      if (!fje || nyere(lok.opdateret, fje.opdateret)) send.push(lok);
    }
  }
  return { resultat, send, hentet };
}

/** Status til grænsefladen. */
export function status() {
  const t = hent();
  return {
    opsat: skyErOpsat(),
    loggetInd: erLoggetInd(),
    epost: brugerEpost(),
    sidsteSync: t.sky?.sidsteSync || null
  };
}
