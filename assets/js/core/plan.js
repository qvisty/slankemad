/**
 * PLANGENERATOR
 *
 * Bygger en uge, der på én gang skal ramme:
 *   1. dine kalorie- og proteinmål
 *   2. retter du rent faktisk har lyst til (favoritter vægter tungt)
 *   3. variation — ingen ret to gange, medmindre det er bevidste rester
 *   4. kort tilberedningstid på hverdage
 *   5. genbrug af råvarer, så en pose spinat bliver brugt op i stedet for smidt ud
 *
 * Metoden er enkel og hurtig: for hver dag prøves mange tilfældige
 * kombinationer, og den med den laveste "straf" vinder. Det er nemmere at
 * justere og forklare end en optimeringsalgoritme — og hurtigt nok til at køre
 * på en telefon.
 */

import { OPSKRIFTER } from '../data/opskrifter.js';
import { VARER } from '../data/varer.js';
import { OPSKRIFT_INDEX, makro, markorer, harFavoritVare, beregnMaal, dagMaal, HURTIG_MINUTTER } from './ernaering.js';

export const UGEDAGE = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];

const SLOT_ANDEL = { morgenmad: 0.22, frokost: 0.30, aftensmad: 0.36, snack: 0.12 };
const FORSOEG = 300;
const MIN_FAKTOR = 0.8;
const MAKS_FAKTOR = 1.5;

/* ---------------- hjælpere ---------------- */

const tilfaeldig = liste => liste[Math.floor(Math.random() * liste.length)];

export function slotsFor(valg) {
  const s = [];
  if (valg.morgenmad) s.push('morgenmad');
  if (valg.frokost) s.push('frokost');
  if (valg.aftensmad) s.push('aftensmad');
  for (let i = 0; i < (valg.snacks || 0); i++) s.push('snack');
  return s.length ? s : ['aftensmad'];
}

/** Hvor stor en del af dagens kalorier et slot skal fylde. */
function slotVaegte(slots) {
  const raa = slots.map(s => SLOT_ANDEL[s]);
  const sum = raa.reduce((a, b) => a + b, 0);
  return raa.map(v => v / sum);
}

export function pulje(slot, tilstand) {
  const { valg, fravalgte } = tilstand;
  const tidsloft = valg.maxTid + (slot === 'aftensmad' ? 5 : 0);
  const alle = OPSKRIFTER.filter(o => {
    if (o.kategori !== slot) return false;
    const mrk = markorer(o);
    if (valg.undgaa.some(u => mrk.has(u))) return false;
    return true;
  });
  const indenforTid = alle.filter(o => o.tid <= tidsloft && !fravalgte.includes(o.id));
  if (indenforTid.length >= 3) return indenforTid;
  // Er filtrene så stramme, at der ikke er nok tilbage, lempes tidskravet
  // hellere end at give en tom plan.
  const udenTid = alle.filter(o => !fravalgte.includes(o.id));
  return udenTid.length ? udenTid : alle;
}

/**
 * Portionsstørrelser pr. måltid.
 *
 * Hvert måltid får sin egen faktor ud fra, hvor stor en del af dagen slottet
 * skal fylde. Det er både mere præcist og mere naturligt end at gange hele
 * dagen med det samme tal: aftensmaden må gerne være en stor portion, uden at
 * morgenmaden også bliver det.
 */
function portionsfaktorer(valgte, slots, budget) {
  const vaegte = slotVaegte(slots);
  const faktorer = valgte.map((o, i) => {
    const kcal = makro(o).kcal;
    if (kcal <= 0) return 1;
    const del = budget * (vaegte[i] ?? (1 / valgte.length));
    return Math.round(Math.min(MAKS_FAKTOR, Math.max(MIN_FAKTOR, del / kcal)) * 20) / 20;
  });
  let kcal = 0, protein = 0;
  valgte.forEach((o, i) => {
    const m = makro(o);
    kcal += m.kcal * faktorer[i];
    protein += m.p * faktorer[i];
  });
  return { faktorer, kcal, protein };
}

/* ---------------- scoring ---------------- */

/**
 * Straf for en dagskombination. Lavere er bedre.
 * Vægtene er tunet så mad-lyst og variation kan slå et par procent på
 * kalorierne — planen skal være til at holde, ikke matematisk perfekt.
 */
function score(valgte, slots, ctx, maalKcal) {
  let tid = 0;
  for (const o of valgte) tid += o.tid;

  const { faktorer, kcal, protein } = portionsfaktorer(valgte, slots, maalKcal);
  if (kcal <= 0) return { straf: Infinity, faktorer: [] };

  let straf = (Math.abs(maalKcal - kcal) / maalKcal) * 140;             // kalorieafvigelse
  // Protein er hele grunden til, at appen findes: det er den variabel, der
  // afgør, om vægttabet kommer fra fedt eller fra muskler. Straffen er sat så
  // højt, at hverken en favoritret eller lidt variation kan opveje en manko.
  straf += Math.max(0, ctx.proteinMaal - protein) * 8;
  straf += Math.max(0, protein - ctx.proteinMaal * 1.25) * 1.2;         // absurd meget protein er også skævt
  straf += faktorer.filter(f => f >= MAKS_FAKTOR).length * 6;           // portioner presset helt i top
  straf += tid / 10;                                                    // hurtigt vinder ved uafgjort

  const set = new Set();
  for (const o of valgte) {
    if (set.has(o.id)) straf += 50;                                      // samme ret to gange samme dag
    set.add(o.id);

    const gange = ctx.brugte.get(o.id) || 0;
    const erRester = o.id === ctx.forrigeAften && o.kategori === 'aftensmad';
    if (erRester && ctx.valg.rester) straf -= 10;                        // rester er en gevinst
    else straf += gange * 18;                                            // ellers: variation

    if (ctx.favoritter.includes(o.id)) straf -= 22;                      // dine egne favoritter vejer tungest
    else if (harFavoritVare(o)) straf -= 7;                              // kylling, laks, tun, salat …

    straf += raavareStraf(o, ctx);
  }
  return { straf, faktorer, kcal, protein };
}

/**
 * Genbrug af råvarer: at bruge en vare, ugen allerede har åbnet, er godt for
 * både pris og madspild. En helt ny fersk vare, hvor pakken er meget større
 * end forbruget, koster point.
 */
function raavareStraf(o, ctx) {
  let straf = 0;
  for (const [noegle, maengde] of o.ing) {
    const v = VARER[noegle];
    if (!v || v.fast) continue;
    const brugtFoer = ctx.brugteVarer.get(noegle) || 0;
    const fersk = v.afd === 'groent' || v.afd === 'kod' || v.afd === 'kol';
    if (brugtFoer > 0) {
      straf -= fersk ? 3.5 : 1.5;                                        // brug posen op
    } else if (fersk && v.pakke && maengde < v.pakke * 0.5) {
      straf += 2.5;                                                      // ny pakke, halvdelen bliver til rest
    }
  }
  return straf;
}

/* ---------------- bygning ---------------- */

function byggDag(ctx, dagNr, traener) {
  const oenskede = slotsFor(ctx.valg);
  // Er et måltid filtreret helt væk (fx både laktose og gluten fravalgt), så
  // udelader vi slottet og siger det højt — i stedet for at bygge en plan på
  // en tom pulje og vælte undervejs.
  const mangler = [];
  const slots = [];
  const puljer = [];
  for (const s of oenskede) {
    const p = pulje(s, ctx.tilstand);
    if (!p.length) { if (!mangler.includes(s)) mangler.push(s); continue; }
    slots.push(s);
    puljer.push(p);
  }
  if (!slots.length) return null;
  const vaegte = slotVaegte(slots);
  const maalKcal = dagMaal(ctx.maal, traener);

  const fleks = ctx.valg.fleksAften && dagNr === Number(ctx.valg.fleksDag) && slots.includes('aftensmad');
  const fleksAndel = fleks ? vaegte[slots.indexOf('aftensmad')] : 0;
  const budgetTilRetter = maalKcal * (1 - fleksAndel);

  let bedst = null;
  for (let i = 0; i < FORSOEG; i++) {
    const valgte = puljer.map((p, j) => {
      if (fleks && slots[j] === 'aftensmad') return null;
      if (ctx.valg.rester && slots[j] === 'frokost' && ctx.forrigeAften && Math.random() < 0.4) {
        const rest = OPSKRIFT_INDEX[ctx.forrigeAften];
        if (rest) return rest;
      }
      return tilfaeldig(p);
    }).filter(Boolean);

    if (!valgte.length) break;
    const aktiveSlots = slots.filter(x => !(fleks && x === 'aftensmad'));
    const s = score(valgte, aktiveSlots, ctx, budgetTilRetter);
    if (!bedst || s.straf < bedst.s.straf) bedst = { s, valgte };
  }
  if (!bedst) return null;

  const brugteIdx = { i: 0 };
  const dagSlots = slots.map((slot, j) => {
    if (fleks && slot === 'aftensmad') {
      return { slot, fleks: true, budget: Math.round(maalKcal * fleksAndel) };
    }
    const i = brugteIdx.i++;
    const o = bedst.valgte[i];
    return {
      slot,
      id: o.id,
      faktor: bedst.s.faktorer[i] ?? 1,
      rester: !!(ctx.valg.rester && slot === 'frokost' && o.id === ctx.forrigeAften)
    };
  });

  return {
    nr: dagNr,
    navn: UGEDAGE[dagNr % 7],
    traener,
    maalKcal,
    mangler,
    slots: dagSlots
  };
}

function lavKontekst(tilstand, brugte = new Map(), brugteVarer = new Map(), forrigeAften = null) {
  const maal = beregnMaal(tilstand.profil);
  return {
    tilstand,
    valg: tilstand.valg,
    favoritter: tilstand.favoritter,
    maal,
    proteinMaal: maal.protein,
    brugte,
    brugteVarer,
    forrigeAften
  };
}

function registrer(dag, brugte, brugteVarer) {
  for (const s of dag.slots) {
    if (!s.id) continue;
    brugte.set(s.id, (brugte.get(s.id) || 0) + 1);
    const o = OPSKRIFT_INDEX[s.id];
    for (const [noegle, maengde] of o.ing) {
      brugteVarer.set(noegle, (brugteVarer.get(noegle) || 0) + maengde);
    }
  }
}

/** Hvilke dage der trænes — spredt jævnt over ugen. */
export function traeningsdage(antal) {
  const moenstre = {
    0: [], 1: [2], 2: [1, 4], 3: [0, 2, 4], 4: [0, 1, 3, 5], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5]
  };
  return moenstre[Math.max(0, Math.min(6, Number(antal) || 0))] || [0, 2, 4];
}

/** Bygger en helt ny plan. */
export function lavPlan(tilstand) {
  const antalDage = Math.max(1, Math.min(7, Number(tilstand.valg.dage) || 7));
  const traen = traeningsdage(tilstand.profil.traening);
  const brugte = new Map();
  const brugteVarer = new Map();
  const dage = [];

  for (let i = 0; i < antalDage; i++) {
    const forrige = dage[i - 1];
    const forrigeAften = forrige ? (forrige.slots.find(s => s.slot === 'aftensmad' && s.id)?.id || null) : null;
    const ctx = lavKontekst(tilstand, brugte, brugteVarer, forrigeAften);
    const dag = byggDag(ctx, i, traen.includes(i));
    if (!dag) continue;
    registrer(dag, brugte, brugteVarer);
    dage.push(dag);
  }

  return { lavet: new Date().toISOString(), dage };
}

/** Bygger én dag om — resten af ugen holdes fast og bruges som kontekst. */
export function regenererDag(tilstand, dagIndex) {
  const plan = tilstand.plan;
  if (!plan?.dage[dagIndex]) return plan;

  const brugte = new Map();
  const brugteVarer = new Map();
  plan.dage.forEach((d, i) => { if (i !== dagIndex) registrer(d, brugte, brugteVarer); });

  const forrige = plan.dage[dagIndex - 1];
  const forrigeAften = forrige ? (forrige.slots.find(s => s.slot === 'aftensmad' && s.id)?.id || null) : null;
  const ctx = lavKontekst(tilstand, brugte, brugteVarer, forrigeAften);
  const ny = byggDag(ctx, dagIndex, plan.dage[dagIndex].traener);
  if (ny) plan.dage[dagIndex] = ny;
  return plan;
}

/** Skifter én ret ud og justerer dagens portionsstørrelse, så dagen holder sit mål. */
export function bytRet(tilstand, dagIndex, slotIndex) {
  const plan = tilstand.plan;
  const dag = plan?.dage[dagIndex];
  const s = dag?.slots[slotIndex];
  if (!s || s.fleks) return plan;

  const brugte = new Set(plan.dage.flatMap(d => d.slots.map(x => x.id)).filter(Boolean));
  const p = pulje(s.slot, tilstand).filter(o => o.id !== s.id);
  if (!p.length) return plan;

  const favoritterFoerst = p.filter(o => tilstand.favoritter.includes(o.id) && !brugte.has(o.id));
  const friske = p.filter(o => !brugte.has(o.id));
  const kandidater = favoritterFoerst.length ? favoritterFoerst : (friske.length ? friske : p);

  s.id = tilfaeldig(kandidater).id;
  s.rester = false;
  justerFaktor(dag);
  return plan;
}

/** Sætter en bestemt ret ind i et slot (bruges når man vælger fra opskriftslisten). */
export function saetRet(tilstand, dagIndex, slotIndex, opskriftId) {
  const dag = tilstand.plan?.dage[dagIndex];
  const s = dag?.slots[slotIndex];
  if (!s || !OPSKRIFT_INDEX[opskriftId]) return tilstand.plan;
  delete s.fleks;
  delete s.budget;
  s.id = opskriftId;
  s.rester = false;
  justerFaktor(dag);
  return tilstand.plan;
}

/** Gør en aften fleksibel (spis ude) — eller fortryder det. */
export function skiftFleks(tilstand, dagIndex, slotIndex) {
  const dag = tilstand.plan?.dage[dagIndex];
  const s = dag?.slots[slotIndex];
  if (!s) return tilstand.plan;
  if (s.fleks) {
    delete s.fleks;
    delete s.budget;
    bytRet(tilstand, dagIndex, slotIndex);
    if (!s.id) s.id = pulje(s.slot, tilstand)[0]?.id;
  } else {
    const vaegt = SLOT_ANDEL[s.slot] || 0.3;
    delete s.id;
    s.fleks = true;
    s.budget = Math.round(dag.maalKcal * vaegt);
  }
  justerFaktor(dag);
  return tilstand.plan;
}

/** Regner dagens portionsstørrelser om — fx efter at en ret er byttet ud. */
function justerFaktor(dag) {
  const aktive = dag.slots.filter(s => s.id && !s.fleks);
  if (!aktive.length) return;
  const fleksKcal = dag.slots.filter(s => s.fleks).reduce((a, s) => a + (s.budget || 0), 0);
  const budget = Math.max(200, dag.maalKcal - fleksKcal);
  const { faktorer } = portionsfaktorer(
    aktive.map(s => OPSKRIFT_INDEX[s.id]),
    aktive.map(s => s.slot),
    budget
  );
  aktive.forEach((s, i) => { s.faktor = faktorer[i] ?? 1; });
}

/* ---------------- opsummering ---------------- */

/** Portionsfaktor for ét måltid. `dag.faktor` er gamle planer fra localStorage. */
export const slotFaktor = (s, dag) => s.faktor ?? dag?.faktor ?? 1;

/** Næring for en hel dag, med dagens portionsfaktor regnet med. */
export function dagensTal(dag) {
  const t = { kcal: 0, p: 0, k: 0, f: 0, fib: 0, tid: 0, retter: 0 };
  for (const s of dag.slots) {
    if (s.fleks) { t.kcal += s.budget || 0; continue; }
    if (!s.id) continue;
    const f = slotFaktor(s, dag);
    const m = makro(s.id);
    t.kcal += m.kcal * f;
    t.p += m.p * f;
    t.k += m.k * f;
    t.f += m.f * f;
    t.fib += m.fib * f;
    t.tid += OPSKRIFT_INDEX[s.id].tid;
    t.retter++;
  }
  return t;
}

/** Nøgletal for hele planen — det dashboardet lever af. */
export function ugensTal(plan) {
  if (!plan?.dage?.length) return null;
  const dage = plan.dage.map(dagensTal);
  const n = dage.length;
  const sum = navn => dage.reduce((a, d) => a + d[navn], 0);

  // Makroer regnes kun på de dage, hvor al mad er planlagt. En fri aften har et
  // kaloriebudget, men vi ved ikke, hvad der bliver spist — at lade den tælle
  // som nul protein ville få proteintallet til at lyve.
  const fasteDage = plan.dage.map((d, i) => ({ d, t: dage[i] })).filter(x => !x.d.slots.some(s => s.fleks));
  const m = navn => (fasteDage.length ? fasteDage.reduce((a, x) => a + x.t[navn], 0) / fasteDage.length : 0);

  const retter = plan.dage.flatMap(d => d.slots.filter(s => s.id).map(s => OPSKRIFT_INDEX[s.id]));
  const hurtige = retter.filter(o => o.tid <= HURTIG_MINUTTER).length;
  const unikke = new Set(retter.map(o => o.id));
  const mangler = [...new Set(plan.dage.flatMap(d => d.mangler || []))];

  return {
    dage: n,
    kcal: sum('kcal') / n,
    protein: m('p'),
    kulhydrat: m('k'),
    fedt: m('f'),
    fiber: m('fib'),
    makroDage: fasteDage.length,
    maaltider: retter.length,
    fleks: plan.dage.flatMap(d => d.slots).filter(s => s.fleks).length,
    tid: sum('tid'),
    tidPrDag: sum('tid') / n,
    hurtige,
    langsomme: retter.length - hurtige,
    unikke: unikke.size,
    mangler,
    // Hvor tæt planen kommer på sit eget mål — bruges til at sige det højt,
    // når de valgte måltider slet ikke kan rumme dagens kalorier.
    daekning: dage.reduce((a, d, i) => a + d.kcal / Math.max(1, plan.dage[i].maalKcal), 0) / n,
    dagligeTal: dage
  };
}
