/**
 * OPSKRIFTER — bladr, søg, marker favoritter.
 */

import { OPSKRIFTER } from '../data/opskrifter.js';
import { makro, maerkater, markorer } from '../core/ernaering.js';
import { hent, erFavorit, skiftFavorit } from '../core/state.js';
import { madSvg } from './billede.js';
import { visOpskrift, kategoriNavn } from './opskriftsark.js';
import { tal, esc, toast } from './format.js';
import { tegn } from './bus.js';

const FILTRE = [
  { id: 'alle', navn: 'Alle' },
  { id: 'favorit', navn: '♥ Favoritter' },
  { id: 'hurtig', navn: 'Under 20 min' },
  { id: 'morgenmad', navn: 'Morgenmad' },
  { id: 'frokost', navn: 'Frokost' },
  { id: 'aftensmad', navn: 'Aftensmad' },
  { id: 'snack', navn: 'Snacks' }
];

let filter = 'alle';
let sog = '';

function udvalg() {
  const t = hent();
  const q = sog.trim().toLowerCase();
  return OPSKRIFTER.filter(o => {
    if (filter === 'favorit' && !erFavorit(o.id)) return false;
    if (filter === 'hurtig' && o.tid > 20) return false;
    if (['morgenmad', 'frokost', 'aftensmad', 'snack'].includes(filter) && o.kategori !== filter) return false;
    if (t.valg.undgaa.length) {
      const mrk = markorer(o);
      if (t.valg.undgaa.some(u => mrk.has(u))) return false;
    }
    if (q) {
      const tekst = `${o.navn} ${o.kort || ''} ${(o.tags || []).join(' ')}`.toLowerCase();
      if (!tekst.includes(q)) return false;
    }
    return true;
  });
}

export function html() {
  const liste = udvalg();
  return `
  <input class="sog" type="search" placeholder="Søg — fx laks, salat, tun" value="${esc(sog)}" data-sog aria-label="Søg i opskrifter">

  <div class="filterraekke">
    ${FILTRE.map(f => `<button class="chip" data-filter="${f.id}" aria-pressed="${filter === f.id}">${esc(f.navn)}</button>`).join('')}
  </div>

  <p class="finprint">${liste.length} ${liste.length === 1 ? 'ret' : 'retter'}${hent().valg.undgaa.length ? ' (dine fravalg er trukket fra)' : ''}</p>

  ${liste.length ? `<div class="opskrift-gitter">
    ${liste.map(o => kort(o)).join('')}
  </div>` : `<div class="tom"><span class="emoji">🔍</span><h3>Ingen retter matcher</h3><p>Prøv en anden søgning, eller slå et filter fra.</p></div>`}`;
}

function kort(o) {
  const m = makro(o);
  // "Hurtig" står allerede som minutter i metadata — en mærkat, der sidder på
  // næsten alt, markerer ingenting.
  const mk = maerkater(o).find(x => x.id !== 'hurtig');
  return `<div class="kort-omslag">
    <button class="opskriftskort" data-ret="${o.id}">
      <div class="billede">${madSvg(o, { b: 320, h: 220 })}</div>
      <div class="krop">
        <span class="label">${esc(kategoriNavn(o.kategori))} · ${o.tid} min</span>
        <h3>${esc(o.navn)}</h3>
        <p class="meta">${tal(m.kcal)} kcal · ${tal(m.p)} g protein</p>
        ${mk ? `<div class="maerkater"><span class="maerke ${mk.id}">${esc(mk.navn)}</span></div>` : ''}
      </div>
    </button>
    <button class="kort-hjerte" data-favorit="${o.id}" aria-pressed="${erFavorit(o.id)}"
      aria-label="${erFavorit(o.id) ? 'Fjern' : 'Gem'} ${esc(o.navn)} som favorit">${erFavorit(o.id) ? '♥' : '♡'}</button>
  </div>`;
}

export function bind(rod) {
  const felt = rod.querySelector('[data-sog]');
  felt?.addEventListener('input', () => {
    sog = felt.value;
    const pos = felt.selectionStart;
    tegn();
    const nyt = document.querySelector('[data-sog]');
    if (nyt) { nyt.focus(); nyt.setSelectionRange(pos, pos); }
  });

  rod.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.filter;
    tegn();
  }));

  rod.querySelectorAll('[data-ret]').forEach(b => b.addEventListener('click', () => visOpskrift(b.dataset.ret)));

  rod.querySelectorAll('[data-favorit]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const nu = skiftFavorit(b.dataset.favorit);
    toast(nu ? 'Gemt som favorit — den kommer oftere i planen' : 'Fjernet fra favoritter');
    tegn();
  }));
}
