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
    sum.pris += (v.pris || 2) * faktor * (v.enh === 'stk' ? 1 : 1);
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

  if (o.tid <= 15) ud.push({ id: 'hurtig', navn: 'Hurtig', titel: `Klar på ${o.tid} min` });
  if (proteinAndel >= 0.30 || m.p >= 35) ud.push({ id: 'protein', navn: 'Proteinrig', titel: `${Math.round(m.p)} g protein pr. portion` });
  if (m.fib >= 8) ud.push({ id: 'fiber', navn: 'Fiberrig', titel: `${Math.round(m.fib)} g fibre pr. portion` });
  if (m.pris <= 45) ud.push({ id: 'billig', navn: 'Billig', titel: 'Bygget på basisvarer' });
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

  const protein = Math.round(2.0 * p.vaegt);      // 2,0 g/kg — muskelbevarelse
  const fedt = Math.round(0.8 * p.vaegt);         // gulv for hormoner og mæthed
  const kulhydrat = Math.max(60, Math.round((kcal - protein * 4 - fedt * 9) / 4));
  const fiber = Math.max(30, Math.round(kcal / 1000 * 14));

  const d = Math.max(1, Math.min(6, p.traening));
  const traeningsdag = Math.round(kcal * 1.10);
  const hviledag = Math.round(kcal - (traeningsdag - kcal) * d / (7 - d));

  const faktisk = tdee - kcal;
  const ugetab = (faktisk * 7) / 7700;
  const kgTilbage = Math.max(0, p.vaegt - p.maalvaegt);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal, protein, fedt, kulhydrat, fiber,
    traeningsdag, hviledag,
    underskud: Math.round(faktisk),
    ugetab,
    uger: faktisk > 0 && kgTilbage > 0 ? Math.ceil((kgTilbage * 7700) / (faktisk * 7)) : null,
    procentPrUge: (ugetab / p.vaegt) * 100,
    begraenset: oensket > maks
  };
}

/** Kaloriemål for en given dag i planen. */
export const dagMaal = (maal, traener) => (traener ? maal.traeningsdag : maal.hviledag);
