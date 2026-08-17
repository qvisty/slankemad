/**
 * ERNÆRING
 *
 * To ting: næringsindhold i en opskrift (beregnet ud fra varekataloget), og
 * dine daglige mål (beregnet ud fra din profil). Ingen af delene rører UI.
 */

import { VARER, FAVORIT_VARER } from '../data/varer.js';
import { OPSKRIFTER } from '../data/opskrifter.js';

export const OPSKRIFT_INDEX = Object.fromEntries(OPSKRIFTER.map(o => [o.id, o]));
export const opskrift = id => OPSKRIFT_INDEX[id];

const cache = new Map();

/** Næring pr. portion for en opskrift. */
export function makro(o) {
  if (typeof o === 'string') o = OPSKRIFT_INDEX[o];
  if (!o) return { kcal: 0, p: 0, k: 0, f: 0, fib: 0, pris: 0 };
  if (cache.has(o.id)) return cache.get(o.id);

  const sum = { kcal: 0, p: 0, k: 0, f: 0, fib: 0, pris: 0, vaegt: 0 };
  for (const [noegle, maengde] of o.ing) {
    const v = VARER[noegle];
    if (!v) continue;
    const faktor = v.enh === 'stk' ? maengde : maengde / 100;
    sum.kcal += v.kcal * faktor;
    sum.p += v.p * faktor;
    sum.k += v.k * faktor;
    sum.f += v.f * faktor;
    sum.fib += (v.fib || 0) * faktor;
    sum.pris += (v.pris || 2) * faktor;   // prisklasse × mængde — kun til sammenligning
  }
  const pr = {};
  for (const n of ['kcal', 'p', 'k', 'f', 'fib', 'pris']) pr[n] = sum[n] / o.basis;
  cache.set(o.id, pr);
  return pr;
}

/** Markører (fisk, gluten, …) i en opskrift — til allergifiltre. */
const mrkCache = new Map();
export function markorer(o) {
  if (typeof o === 'string') o = OPSKRIFT_INDEX[o];
  if (!o) return new Set();
  if (mrkCache.has(o.id)) return mrkCache.get(o.id);
  const s = new Set();
  for (const [noegle] of o.ing) (VARER[noegle]?.mrk || []).forEach(m => s.add(m));
  mrkCache.set(o.id, s);
  return s;
}

export const harFavoritVare = o =>
  (typeof o === 'string' ? OPSKRIFT_INDEX[o] : o).ing.some(([n]) => FAVORIT_VARER.includes(n));

/** Grænsen for "hurtig" — bruges både på mærkater og i ugens nøgletal. */
export const HURTIG_MINUTTER = 20;

/**
 * Mærkater, der er værd at vise på et opskriftskort.
 * De beregnes — de står ikke i data — så de aldrig kan komme i utakt med tallene.
 */
export function maerkater(o) {
  if (typeof o === 'string') o = OPSKRIFT_INDEX[o];
  const m = makro(o);
  const ud = [];
  const proteinAndel = (m.p * 4) / Math.max(1, m.kcal);
  const kulhydratAndel = (m.k * 4) / Math.max(1, m.kcal);

  if (o.tid <= HURTIG_MINUTTER) ud.push({ id: 'hurtig', navn: 'Hurtig', titel: `Klar på ${o.tid} min` });
  if (proteinAndel >= 0.30 || m.p >= 35) ud.push({ id: 'protein', navn: 'Proteinrig', titel: `${Math.round(m.p)} g protein pr. portion` });
  if (m.fib >= 8) ud.push({ id: 'fiber', navn: 'Fiberrig', titel: `${Math.round(m.fib)} g fibre pr. portion` });
  if (m.pris <= 3.2) ud.push({ id: 'billig', navn: 'Billig', titel: 'Bygget på basisvarer' });
  if (kulhydratAndel >= 0.38 && m.k >= 45) ud.push({ id: 'traening', navn: 'God træningsdag', titel: `${Math.round(m.k)} g kulhydrat — brændstof til Bodypump` });
  else if (kulhydratAndel <= 0.28 && proteinAndel >= 0.28) ud.push({ id: 'hvile', navn: 'God hviledag', titel: 'Højt protein, færre kulhydrater' });
  if (o.tags?.includes('meal-prep') || o.tags?.includes('batch')) ud.push({ id: 'prep', navn: 'Meal-prep', titel: 'Holder sig og kan laves i forvejen' });
  return ud;
}

/* ==================================================================
   DAGLIGE MÅL
================================================================== */

/** Kalorier brændt pr. Bodypump-time — konservativt sat. */
const KCAL_PR_TRAENING = 350;

/** Tempo, der begynder at koste muskelmasse — samme tal som i guiden. */
export const HURTIGT_TEMPO_PCT = 0.7;

export function beregnMaal(p) {
  const bmr = p.koen === 'kvinde'
    ? 10 * p.vaegt + 6.25 * p.hojde - 5 * p.alder - 161
    : 10 * p.vaegt + 6.25 * p.hojde - 5 * p.alder + 5;

  const traeningPrDag = (p.traening * KCAL_PR_TRAENING) / 7;
  const tdee = bmr * p.aktivitet + traeningPrDag;

  const oensket = (p.tempo * 7700) / 7;
  const maks = tdee * 0.25;                       // aldrig et ekstremt underskud
  const underskud = Math.min(oensket, maks);
  const kcal = Math.max(Math.round(tdee - underskud), Math.round(bmr * 1.05));

  // Protein regnes af målvægten, ikke af den vægt du har nu: fedtvæv har ikke
  // et proteinbehov, og 2 g pr. kg nuværende vægt låser unødigt mange kalorier,
  // der er bedre brugt på kulhydrat til træningen.
  const proteinVaegt = p.maalvaegt && p.maalvaegt < p.vaegt
    ? Math.max(p.maalvaegt, p.vaegt * 0.8)
    : p.vaegt;
  const protein = Math.round(2.0 * proteinVaegt);
  const fedt = Math.round(0.8 * proteinVaegt);    // gulv for hormoner og mæthed
  const kulhydrat = Math.max(60, Math.round((kcal - protein * 4 - fedt * 9) / 4));
  const fiber = Math.max(30, Math.round(kcal / 1000 * 14));

  // Trænings- og hviledage: samme ugegennemsnit, men kalorierne flyttes hen,
  // hvor de bliver brugt. Forskellen skrues ned, hvis en hviledag ellers ville
  // falde under et fornuftigt gulv — det var før muligt at få 900 kcal på en
  // hviledag ved seks ugentlige træningsdage.
  const d = Math.max(0, Math.min(6, Number(p.traening) || 0));
  const hviledage = 7 - d;
  const gulv = Math.max(Math.round(bmr), 1500);
  let traeningsdag = kcal;
  let hviledag = kcal;
  if (d > 0 && hviledage > 0) {
    let delta = Math.min(kcal * 0.10, 250);
    if (kcal - (delta * d) / hviledage < gulv) {
      delta = Math.max(0, ((kcal - gulv) * hviledage) / d);
    }
    traeningsdag = Math.round(kcal + delta);
    hviledag = Math.round(kcal - (delta * d) / hviledage);
  }

  // Protein og fedt er faste; kulhydraterne bærer forskellen mellem dagene.
  const kulhydratTraening = Math.max(40, Math.round((traeningsdag - protein * 4 - fedt * 9) / 4));
  const kulhydratHvile = Math.max(40, Math.round((hviledag - protein * 4 - fedt * 9) / 4));

  const faktisk = tdee - kcal;
  const ugetab = (faktisk * 7) / 7700;
  const kgTilbage = Math.max(0, p.vaegt - p.maalvaegt);
  const procentPrUge = (ugetab / p.vaegt) * 100;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal, protein, fedt, kulhydrat, fiber,
    proteinVaegt: Math.round(proteinVaegt),
    traeningsdag, hviledag, kulhydratTraening, kulhydratHvile,
    underskud: Math.round(faktisk),
    ugetab,
    // Lineær fremskrivning. Stofskiftet falder med vægten, så det reelle
    // forløb er 15-25 % længere — det står der i teksten ved siden af.
    uger: faktisk > 0 && kgTilbage > 0 ? Math.ceil((kgTilbage * 7700) / (faktisk * 7)) : null,
    procentPrUge,
    hurtigt: procentPrUge > HURTIGT_TEMPO_PCT,
    begraenset: oensket > maks
  };
}

/** Kaloriemål for en given dag i planen. */
export const dagMaal = (maal, traener) => (traener ? maal.traeningsdag : maal.hviledag);
