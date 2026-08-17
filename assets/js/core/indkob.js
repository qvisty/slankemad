/**
 * INDKØBSLOGIK
 *
 * Slår ens råvarer sammen på tværs af hele planen: bruger tre retter kylling,
 * står der ét tal for kylling på listen. Grupperer efter butiksafdeling, så
 * listen følger den rækkefølge, man går gennem butikken i.
 *
 * Appen viser bevidst ingen priser. Der findes ikke en offentlig, kontrollerbar
 * priskilde vi henter fra, og opdigtede priser er værre end ingen.
 */

import { VARER, AFDELINGER } from '../data/varer.js';
import { OPSKRIFT_INDEX } from './ernaering.js';
import { slotFaktor } from './plan.js';

/** Runder op til noget, man kan finde ud af at veje af i butikken. */
function pænMaengde(v, maengde) {
  // Altid op. Runder man ned, mangler der råvarer til det sidste måltid.
  if (v.enh === 'stk') return Math.ceil(maengde - 0.001);
  if (maengde < 30) return Math.ceil(maengde);
  if (maengde < 200) return Math.ceil(maengde / 10) * 10;
  return Math.ceil(maengde / 25) * 25;
}

/**
 * @returns {{grupper: Array, fast: Array, antal: number, retter: number, genbrug: Array}}
 */
export function byggListe(tilstand, { grupperEfter = 'afdeling' } = {}) {
  const plan = tilstand.plan;
  const tom = { grupper: [], fast: [], antal: 0, retter: 0, genbrug: [] };
  if (!plan?.dage?.length) return tom;

  const personer = Math.max(1, Number(tilstand.valg.personer) || 1);
  const total = new Map();      // varenøgle -> { maengde, retter:Set }

  for (const dag of plan.dage) {
    for (const s of dag.slots) {
      if (!s.id) continue;
      const o = OPSKRIFT_INDEX[s.id];
      if (!o) continue;
      const skala = (personer / o.basis) * slotFaktor(s, dag);
      for (const [noegle, maengde] of o.ing) {
        if (!VARER[noegle]) continue;
        const post = total.get(noegle) || { maengde: 0, retter: new Set(), prRet: new Map() };
        post.maengde += maengde * skala;
        post.retter.add(o.id);
        post.prRet.set(o.id, (post.prRet.get(o.id) || 0) + maengde * skala);
        total.set(noegle, post);
      }
    }
  }

  const linjer = [];
  const fast = [];
  for (const [noegle, post] of total) {
    const v = VARER[noegle];
    const maengde = pænMaengde(v, post.maengde);
    const linje = {
      noegle,
      navn: v.navn,
      afd: v.afd,
      enh: v.enh,
      maengde,
      pakke: v.pakke || null,
      pakker: v.pakke ? Math.ceil(maengde / v.pakke) : null,
      alt: v.alt || null,
      retter: [...post.retter],
      prRet: post.prRet,
      fast: !!v.fast
    };
    (v.fast ? fast : linjer).push(linje);
  }

  const kilde = tilstand.valg.fasteVarer ? linjer.concat(fast) : linjer;
  const sorter = (a, b) => a.navn.localeCompare(b.navn, 'da');

  let grupper;
  if (grupperEfter === 'opskrift') {
    const brugte = [...new Set(plan.dage.flatMap(d => d.slots.map(s => s.id)).filter(Boolean))];
    // Under hver ret vises kun den mængde, netop den ret bruger — ikke hele
    // ugens mængde af varen.
    grupper = brugte.map(id => ({
      id,
      navn: OPSKRIFT_INDEX[id].navn,
      emoji: '',
      varer: kilde
        .filter(l => l.retter.includes(id))
        .map(l => {
          const v = VARER[l.noegle];
          const m = pænMaengde(v, l.prRet.get(id) || 0);
          return { ...l, maengde: m, pakker: v.pakke ? Math.ceil(m / v.pakke) : null };
        })
        .sort(sorter)
    })).filter(g => g.varer.length);
  } else {
    grupper = AFDELINGER
      .map(a => ({ id: a.id, navn: a.navn, emoji: a.emoji, varer: kilde.filter(l => l.afd === a.id).sort(sorter) }))
      .filter(g => g.varer.length);
  }

  // Råvarer der går igen i flere retter — det er dem, der holder prisen og
  // madspildet nede, og de er værd at vise brugeren.
  const genbrug = linjer
    .filter(l => l.retter.length >= 2)
    .sort((a, b) => b.retter.length - a.retter.length)
    .slice(0, 6);

  return {
    grupper,
    fast: tilstand.valg.fasteVarer ? [] : fast,
    antal: kilde.length,
    retter: new Set(plan.dage.flatMap(d => d.slots.map(s => s.id)).filter(Boolean)).size,
    genbrug
  };
}

/** Mængde som tekst: 1,2 kg / 400 g / 3 stk. */
export function maengdeTekst(l) {
  const n = x => Number(x).toLocaleString('da-DK', { maximumFractionDigits: 1 });
  if (l.enh === 'stk') return `${n(l.maengde)} stk`;
  if (l.enh === 'ml') return l.maengde >= 1000 ? `${n(l.maengde / 1000)} l` : `${n(l.maengde)} ml`;
  return l.maengde >= 1000 ? `${n(l.maengde / 1000)} kg` : `${n(l.maengde)} g`;
}

/** Ren tekstversion — til udklipsholderen. */
export function somTekst(liste) {
  return liste.grupper
    .map(g => `${g.navn.toUpperCase()}\n` + g.varer.map(l => `[ ] ${maengdeTekst(l)}  ${l.navn}`).join('\n'))
    .join('\n\n');
}
