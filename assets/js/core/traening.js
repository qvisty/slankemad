/**
 * TRÆNING — al logik omkring ugeplan, registrering og progression.
 * Kender ikke DOM. Kan køres og testes uden browser.
 *
 * To principper er hårde:
 *
 *  1. **Historik ændrer sig aldrig.** Når en træning registreres, gemmes et
 *     øjebliksbillede af skabelonen sammen med sessionen. Ændres planen senere,
 *     står de gennemførte træninger uberørt.
 *  2. **Ingen opdigtede tal.** Der beregnes hverken kalorier, puls, tempo,
 *     distance eller belastning. Findes et tal ikke, er feltet tomt.
 */

import { SKABELON_INDEX, UGEPLAN, OEVELSE_INDEX, REGLER, INTENSITETER } from '../data/traening.js';

const INTENSITET_IDER = Object.keys(INTENSITETER);

export const STATUS = {
  planlagt: 'planlagt',
  igang: 'igang',
  gennemfoert: 'gennemfoert',
  sprunget: 'sprunget'
};

export const STATUS_NAVN = {
  planlagt: 'Planlagt',
  igang: 'I gang',
  gennemfoert: 'Gennemført',
  sprunget: 'Sprunget over'
};

/* ==================================================================
   DATO — mandag er dag 0 hele vejen igennem
================================================================== */

export const iso = d => {
  const dato = d instanceof Date ? d : new Date(d);
  return `${dato.getFullYear()}-${String(dato.getMonth() + 1).padStart(2, '0')}-${String(dato.getDate()).padStart(2, '0')}`;
};

export const idag = () => iso(new Date());

/** Ugedag med mandag = 0 (JavaScript har søndag = 0). */
export function ugedag(dato) {
  const d = new Date(`${dato}T12:00:00`);
  return (d.getDay() + 6) % 7;
}

/** Datoen for mandagen i den uge, `dato` ligger i. */
export function mandagI(dato) {
  const d = new Date(`${dato}T12:00:00`);
  d.setDate(d.getDate() - ugedag(dato));
  return iso(d);
}

export function laegTil(dato, dage) {
  const d = new Date(`${dato}T12:00:00`);
  d.setDate(d.getDate() + dage);
  return iso(d);
}

/** Datoerne i ugen, mandag til søndag. */
export const ugensDatoer = dato => {
  const m = mandagI(dato);
  return Array.from({ length: 7 }, (_, i) => laegTil(m, i));
};

const DAGSNAVNE = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
export const dagsnavn = dato => DAGSNAVNE[ugedag(dato)];

export function datoTekst(dato) {
  const d = new Date(`${dato}T12:00:00`);
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'long' });
}

/* ==================================================================
   PLANEN
================================================================== */

/** Hvad står der i planen for denne dato? */
export function planFor(dato) {
  const dag = UGEPLAN[ugedag(dato)];
  return {
    dato,
    ugedag: dag.ugedag,
    navn: dag.navn,
    skabelon: SKABELON_INDEX[dag.skabelonId],
    gaatur: dag.gaatur,
    gaaturValgfri: !!dag.gaaturValgfri,
    gaaturErTraeningen: !!dag.gaaturErTraeningen
  };
}

/** Det niveau, brugeren har valgt for en skabelon med flere niveauer. */
export function aktivtNiveau(tilstand, skabelonId) {
  const s = SKABELON_INDEX[skabelonId];
  if (!s?.niveauer?.length) return null;
  const valgt = tilstand.traening?.niveauer?.[skabelonId];
  return s.niveauer.find(n => n.id === valgt) || s.niveauer.find(n => n.standard) || s.niveauer[0];
}

export function saetNiveau(tilstand, skabelonId, niveauId) {
  const s = SKABELON_INDEX[skabelonId];
  if (!s?.niveauer?.some(n => n.id === niveauId)) return false;
  tilstand.traening.niveauer = { ...(tilstand.traening.niveauer || {}), [skabelonId]: niveauId };
  // Sessioner, der endnu ikke er registreret, skal følge det nye valg — ellers
  // står der 6 × 1 minut i historikken på en dag, hvor der blev løbet 4 × 4.
  for (const sess of tilstand.traening.sessioner || []) {
    if (sess.skabelonId !== skabelonId) continue;
    if (sess.status === STATUS.gennemfoert || sess.status === STATUS.sprunget) continue;
    sess.snapshot = oejebliksbillede(s, aktivtNiveau(tilstand, skabelonId));
  }
  return true;
}

/* ==================================================================
   SESSIONER
================================================================== */

/**
 * Øjebliksbillede af skabelonen, som den så ud, da træningen blev gennemført.
 * Det er dét, historikken viser — ikke den nuværende plan.
 */
function oejebliksbillede(skabelon, niveau) {
  if (!skabelon) return null;
  const oevelseIder = [...(skabelon.oevelser || []), skabelon.afslutning].filter(Boolean);
  return {
    skabelonId: skabelon.id,
    navn: skabelon.navn,
    type: skabelon.type,
    intensitet: skabelon.intensitet,
    varighed: skabelon.varighed,
    varighedMin: skabelon.varighedMin || null,
    varighedMaks: skabelon.varighedMaks || null,
    tidspunkt: skabelon.tidspunkt || null,
    resume: skabelon.resume || '',
    formaal: skabelon.formaal ? [...skabelon.formaal] : [],
    noter: skabelon.noter ? [...skabelon.noter] : [],
    registrer: skabelon.registrer ? [...skabelon.registrer] : [],
    niveauId: niveau?.id || null,
    niveauNavn: niveau?.navn || null,
    blokke: niveau?.blokke ? structuredClone(niveau.blokke) : null,
    oevelser: skabelon.oevelser ? [...skabelon.oevelser] : null,
    afslutning: skabelon.afslutning || null,
    runder: skabelon.runder || null,
    vaegtTracks: skabelon.vaegtTracks ? [...skabelon.vaegtTracks] : null,
    // Øvelsernes definition fryses med, så en senere ændring af maalMaks eller
    // antal sæt ikke omvurderer gammel træning med tilbagevirkende kraft.
    oevelseDef: Object.fromEntries(oevelseIder
      .filter(id => OEVELSE_INDEX[id])
      .map(id => {
        const o = OEVELSE_INDEX[id];
        return [id, { navn: o.navn, saet: o.saet, maal: o.maal, maalMin: o.maalMin || null,
          maalMaks: o.maalMaks || null, registrer: [...o.registrer], prSide: !!o.prSide,
          formaal: o.formaal, beskrivelse: o.beskrivelse }];
      }))
  };
}

/**
 * Det, en dag skal VISES som: øjebliksbilledet hvis træningen er registreret,
 * ellers den aktuelle plan. Uden det viser detaljevisningen den nuværende plan
 * oven på gamle data — altså øvelser, brugeren aldrig lavede.
 */
export function visning(tilstand, dato) {
  const s = sessionFor(tilstand, dato);
  if (s?.snapshot && (s.status === STATUS.gennemfoert || s.status === STATUS.sprunget)) return s.snapshot;
  const plan = planFor(dato);
  return oejebliksbillede(plan.skabelon, aktivtNiveau(tilstand, plan.skabelon?.id));
}

export const sessionFor = (tilstand, dato) =>
  (tilstand.traening?.sessioner || []).find(s => s.dato === dato) || null;

/** Opretter sessionen, hvis den ikke findes. Returnerer den. */
export function sikrSession(tilstand, dato) {
  let s = sessionFor(tilstand, dato);
  if (s) return s;
  const plan = planFor(dato);
  s = {
    id: `s-${dato}`,
    dato,
    skabelonId: plan.skabelon?.id || null,
    status: STATUS.planlagt,
    startet: null,
    sluttet: null,
    varighed: null,
    intensitet: null,
    note: '',
    vaegte: {},
    intervaller: null,
    saet: [],
    snapshot: oejebliksbillede(plan.skabelon, aktivtNiveau(tilstand, plan.skabelon?.id))
  };
  tilstand.traening.sessioner = [...(tilstand.traening.sessioner || []), s];
  return s;
}

export function saetStatus(tilstand, dato, status, naa = new Date()) {
  if (!Object.values(STATUS).includes(status)) return null;
  if (dato > iso(naa)) return null;            // man kan ikke gennemføre en dag, der ikke er kommet
  const s = sikrSession(tilstand, dato);
  s.status = status;
  if (status === STATUS.igang && !s.startet) s.startet = naa.toISOString();
  if (status === STATUS.gennemfoert) {
    s.sluttet = naa.toISOString();
    // Snapshottet fryses her — det er nu, træningen er sket.
    const plan = planFor(dato);
    s.snapshot = oejebliksbillede(plan.skabelon, aktivtNiveau(tilstand, plan.skabelon?.id));
  }
  // Varigheden opfindes ikke. Er den ikke tastet ind, er den tom — planens tal
  // står som placeholder i formularen, men bliver aldrig til registreret data.
  return s;
}

/** Opdaterer felter på en session. Kun kendte felter, kun faktiske værdier. */
export function gemSession(tilstand, dato, felter = {}) {
  const s = sikrSession(tilstand, dato);
  const plan = planFor(dato);
  const tracks = s.snapshot?.vaegtTracks || plan.skabelon?.vaegtTracks || [];

  for (const [n, v] of Object.entries(felter)) {
    if (n === 'varighed' || n === 'intervaller') {
      const tal = tilTal(v);
      s[n] = tal == null || tal < 0 || tal > (n === 'varighed' ? 600 : 60) ? null : tal;
    } else if (n === 'intensitet') {
      s.intensitet = INTENSITET_IDER.includes(v) ? v : null;
    } else if (n === 'note') {
      s.note = typeof v === 'string' ? v.slice(0, 500) : '';
    } else if (n === 'vaegte') {
      // Kun de tracks, træningen faktisk har — og kun tal.
      const ud = {};
      for (const [track, vaerdi] of Object.entries(v || {})) {
        if (!tracks.includes(track)) continue;
        const tal = tilTal(vaerdi);
        if (tal != null && tal >= 0 && tal <= 300) ud[track] = tal;
      }
      s.vaegte = ud;
    } else if (n === 'startet' || n === 'sluttet') {
      s[n] = typeof v === 'string' ? v : null;
    }
  }
  if (s.note == null) s.note = '';
  return s;
}

/**
 * Registrerer ét sæt. Tomme felter gemmes ikke som nul — de gemmes ikke.
 * @param {number} saetNr 1-indekseret
 */
const GRAENSER = { gentagelser: 500, vaegt: 300, sekunder: 3600 };

/** Tal fra et inputfelt: tom, whitespace og vrøvl bliver til ingenting — ikke til nul. */
function tilTal(v) {
  if (v == null || typeof v === 'boolean' || Array.isArray(v)) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function gemSaet(tilstand, dato, oevelseId, saetNr, vaerdier = {}) {
  const oev = OEVELSE_INDEX[oevelseId];
  if (!oev) return null;

  // Øvelsen skal indgå i dagens træning. Ellers kunne armbøjninger registreres
  // på en BodyPump-dag og tælle med i progressionsreglen.
  const plan = planFor(dato);
  const hoerer = [...(plan.skabelon?.oevelser || []), plan.skabelon?.afslutning].includes(oevelseId);
  if (!hoerer) return null;

  const nr = Number(saetNr);
  if (!Number.isInteger(nr) || nr < 1 || nr > (oev.saet || 1)) return null;

  const s = sikrSession(tilstand, dato);
  const post = s.saet.find(x => x.oevelseId === oevelseId && x.saetNr === nr)
    || { oevelseId, saetNr: nr };
  for (const n of ['gentagelser', 'vaegt', 'sekunder']) {
    if (!(n in vaerdier)) continue;
    if (!oev.registrer.includes(n)) continue;          // vægt på armbøjninger giver ingen mening
    const v = tilTal(vaerdier[n]);
    if (v == null || v < 0 || v > GRAENSER[n]) delete post[n];
    else post[n] = v;
  }
  const harVaerdi = ['gentagelser', 'vaegt', 'sekunder'].some(n => n in post);
  s.saet = s.saet.filter(x => !(x.oevelseId === oevelseId && x.saetNr === nr));
  if (harVaerdi) {
    s.saet.push(post);
    // Er der tal i en træning, er den i gang — ellers ville de forsvinde i
    // statistikken, fordi kun gennemførte træninger tælles med.
    if (s.status === STATUS.planlagt) s.status = STATUS.igang;
  }
  s.saet.sort((a, b) => a.oevelseId.localeCompare(b.oevelseId) || a.saetNr - b.saetNr);
  return post;
}

export const saetFor = (session, oevelseId, saetNr) =>
  session?.saet?.find(x => x.oevelseId === oevelseId && x.saetNr === saetNr) || null;

/* ==================================================================
   GÅTURE — registreres separat fra dagens træning
================================================================== */

export const gaaturFor = (tilstand, dato) =>
  (tilstand.traening?.gaature || []).find(g => g.dato === dato) || null;

export function gemGaatur(tilstand, dato, minutter, note = '') {
  const liste = (tilstand.traening.gaature || []).filter(g => g.dato !== dato);
  const m = Number(minutter);
  if (Number.isFinite(m) && m > 0) liste.push({ dato, minutter: Math.round(m), note });
  tilstand.traening.gaature = liste.sort((a, b) => a.dato.localeCompare(b.dato));
  return gaaturFor(tilstand, dato);
}

/* ==================================================================
   UGEN
================================================================== */

export function ugensDage(tilstand, dato) {
  return ugensDatoer(dato).map(d => {
    const plan = planFor(d);
    const session = sessionFor(tilstand, d);
    return {
      ...plan,
      session,
      status: session?.status || STATUS.planlagt,
      gaaturLog: gaaturFor(tilstand, d),
      // Historik viser det, der faktisk blev gennemført
      vist: visning(tilstand, d)
    };
  });
}

/** Ugens balance — udelukkende talt på registrerede træninger. */
export function ugensBalance(tilstand, dato) {
  const dage = ugensDage(tilstand, dato);
  const gennemfoert = dage.filter(d => d.status === STATUS.gennemfoert);
  const tael = type => gennemfoert.filter(d => d.vist?.type === type).length;
  const planlagtTael = type => dage.filter(d => d.vist?.type === type).length;

  const gaaMinutter = dage.reduce((a, d) => a + (d.gaaturLog?.minutter || 0), 0);
  // På en dag hvor gåturen ER træningen (søndag), tælles minutterne kun én gang.
  const traeningsminutter = gennemfoert
    .filter(d => !(d.gaaturErTraeningen && d.gaaturLog))
    .reduce((a, d) => a + (d.session?.varighed || 0), 0);

  return {
    dage,
    gennemfoert: gennemfoert.length,
    planlagt: dage.length,
    sprunget: dage.filter(d => d.status === STATUS.sprunget).length,
    styrke: tael('styrke') + tael('hjemme'),
    styrkePlanlagt: planlagtTael('styrke') + planlagtTael('hjemme'),
    kondition: tael('lob') + tael('interval'),
    konditionPlanlagt: planlagtTael('lob') + planlagtTael('interval'),
    restitution: tael('restitution'),
    restitutionPlanlagt: planlagtTael('restitution'),
    gaaMinutter,
    gaaDage: dage.filter(d => d.gaaturLog).length,
    traeningsminutter
  };
}

/* ==================================================================
   HISTORIK OG NØGLETAL — kun registrerede data
================================================================== */

export function historik(tilstand, antal = 20) {
  return (tilstand.traening?.sessioner || [])
    .filter(s => s.status === STATUS.gennemfoert || s.status === STATUS.sprunget)
    .sort((a, b) => b.dato.localeCompare(a.dato))
    .slice(0, antal);
}

const gennemfoerte = tilstand =>
  (tilstand.traening?.sessioner || [])
    .filter(s => s.status === STATUS.gennemfoert)
    .sort((a, b) => a.dato.localeCompare(b.dato));

/** Serie af bedste sæt pr. træning for en øvelse — til progressionsgrafen. */
export function serie(tilstand, oevelseId, felt = 'gentagelser') {
  return gennemfoerte(tilstand)
    .map(s => {
      const saet = (s.saet || []).filter(x => x.oevelseId === oevelseId && Number.isFinite(x[felt]));
      if (!saet.length) return null;
      return { dato: s.dato, vaerdi: Math.max(...saet.map(x => x[felt])), saet: saet.length };
    })
    .filter(Boolean);
}

/** Løbetid pr. gennemført løbetræning. */
export function lobeserie(tilstand, type = 'lob') {
  return gennemfoerte(tilstand)
    .filter(s => s.snapshot?.type === type && Number.isFinite(s.varighed))
    .map(s => ({ dato: s.dato, vaerdi: s.varighed }));
}

/** Antal gennemførte træninger pr. uge, nyeste sidst. */
export function traeningerPrUge(tilstand, antalUger = 8) {
  const alle = gennemfoerte(tilstand);
  if (!alle.length) return [];
  const uger = new Map();
  for (const s of alle) {
    const m = mandagI(s.dato);
    uger.set(m, (uger.get(m) || 0) + 1);
  }
  return [...uger.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-antalUger)
    .map(([mandag, antal]) => ({ dato: mandag, vaerdi: antal }));
}

/**
 * De få tal, der er værd at følge. Returnerer kun dem, der faktisk har data —
 * et manglende tal er bedre end et opdigtet.
 */
export function noegletal(tilstand) {
  const ud = [];

  const push = serie(tilstand, 'armboejninger');
  if (push.length) {
    ud.push({
      id: 'armboejninger',
      navn: 'Armbøjninger, bedste sæt',
      enhed: 'gent.',
      nu: push[push.length - 1].vaerdi,
      foer: push[0].vaerdi,
      serie: push
    });
  }

  const row = serie(tilstand, 'row', 'vaegt');
  if (row.length) {
    ud.push({
      id: 'row',
      navn: 'Håndvægt row',
      enhed: 'kg',
      nu: row[row.length - 1].vaerdi,
      foer: row[0].vaerdi,
      serie: row
    });
  }

  const lob = lobeserie(tilstand, 'lob');
  if (lob.length) {
    ud.push({
      id: 'lob',
      navn: 'Roligt løb, varighed',
      enhed: 'min',
      nu: lob[lob.length - 1].vaerdi,
      foer: lob[0].vaerdi,
      serie: lob
    });
  }

  const intervaller = gennemfoerte(tilstand)
    .filter(s => s.snapshot?.type === 'interval' && Number.isFinite(s.intervaller))
    .map(s => ({ dato: s.dato, vaerdi: s.intervaller }));
  if (intervaller.length) {
    ud.push({
      id: 'intervaller',
      navn: 'Gennemførte intervaller',
      enhed: 'stk',
      nu: intervaller[intervaller.length - 1].vaerdi,
      foer: intervaller[0].vaerdi,
      serie: intervaller
    });
  }

  const uger = traeningerPrUge(tilstand);
  if (uger.length) {
    ud.push({
      id: 'uger',
      navn: 'Træninger pr. uge',
      enhed: '',
      nu: uger[uger.length - 1].vaerdi,
      foer: uger[0].vaerdi,
      serie: uger
    });
  }

  return ud;
}

/* ==================================================================
   PROGRESSION — forslag, aldrig automatik
================================================================== */

/** Har brugeren allerede sagt ja til dette forslag, og hvornår? */
const accepteretDato = (tilstand, regelId) => tilstand.traening?.accepteret?.[regelId] || null;

function opfylder(tilstand, regel) {
  const sessioner = gennemfoerte(tilstand);
  const efter = accepteretDato(tilstand, regel.id);
  const relevante = efter ? sessioner.filter(s => s.dato > efter) : sessioner;

  if (regel.betingelse.type === 'alleSaetPaaMaks') {
    const antal = relevante.filter(s => {
      // Definitionen fra dengang træningen blev lavet — ikke den nuværende.
      const def = s.snapshot?.oevelseDef?.[regel.oevelseId] || OEVELSE_INDEX[regel.oevelseId];
      if (!def?.maalMaks) return false;
      const saet = (s.saet || []).filter(x => x.oevelseId === regel.oevelseId && Number.isFinite(x.gentagelser));
      return saet.length >= def.saet && saet.every(x => x.gentagelser >= def.maalMaks);
    }).length;
    return { opfyldt: antal >= regel.betingelse.gange, antal, kraevet: regel.betingelse.gange };
  }

  if (regel.betingelse.type === 'alleIntervallerGennemfoert') {
    const antal = relevante.filter(s => {
      if (s.snapshot?.skabelonId !== regel.skabelonId) return false;
      const planlagt = s.snapshot?.blokke?.find(b => b.gentagelser)?.gentagelser;
      return Number.isFinite(planlagt) && Number.isFinite(s.intervaller) && s.intervaller >= planlagt;
    }).length;
    return { opfyldt: antal >= regel.betingelse.gange, antal, kraevet: regel.betingelse.gange };
  }

  return { opfyldt: false, antal: 0 };
}

/**
 * Forslag baseret på faktisk registrerede data. Ændrer aldrig noget selv —
 * brugeren skal aktivt acceptere.
 */
export function progressionsForslag(tilstand) {
  return REGLER
    .map(regel => {
      const r = opfylder(tilstand, regel);
      if (!r.opfyldt) return null;
      return {
        id: regel.id,
        oevelseId: regel.oevelseId || null,
        skabelonId: regel.skabelonId || null,
        navn: regel.oevelseId ? OEVELSE_INDEX[regel.oevelseId].navn : SKABELON_INDEX[regel.skabelonId]?.navn,
        tekst: regel.forslag,
        handling: regel.handling,
        grundlag: `Opfyldt ${r.antal} ${r.antal === 1 ? 'gang' : 'gange'}`
      };
    })
    .filter(Boolean);
}


/** Brugeren siger ja tak — først dér ændres noget. */
export function accepterForslag(tilstand, regelId, dato = idag()) {
  const regel = REGLER.find(r => r.id === regelId);
  if (!regel) return false;
  tilstand.traening.accepteret = { ...(tilstand.traening.accepteret || {}), [regelId]: dato };

  // Intervalniveauet er det eneste forslag, der kan udføres af appen selv.
  if (regel.skabelonId) {
    const s = SKABELON_INDEX[regel.skabelonId];
    const nu = aktivtNiveau(tilstand, regel.skabelonId);
    const i = s.niveauer.findIndex(n => n.id === nu?.id);
    const naeste = s.niveauer[i + 1];
    if (naeste) saetNiveau(tilstand, regel.skabelonId, naeste.id);
  }
  return true;
}

export function afvisForslag(tilstand, regelId, dato = idag()) {
  tilstand.traening.accepteret = { ...(tilstand.traening.accepteret || {}), [regelId]: dato };
  return true;
}
