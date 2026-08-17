/**
 * APP-SKAL — to sektioner, navigation og gentegning.
 *
 * Appen har to hoveder, der ikke skal blandes: **Træning** og **Mad**. Et skift
 * øverst deler dem, så træningsvisningerne aldrig indeholder kost eller
 * kalorier — og bundnavigationen bliver ved med at have fem punkter på mobil.
 *
 * Al forretningslogik ligger i core/, alt indhold i data/, alt visning i ui/.
 */

import { hent, opdater, abonner } from './core/state.js';
import { lavPlan } from './core/plan.js';
import * as tr from './core/traening.js';
import * as sky from './core/sky.js';
import { skyErOpsat } from './data/sky-config.js';
import { saetTegner, saetSkifter } from './ui/bus.js';
import { $, toast, skjulToast } from './ui/format.js';
import * as dashboard from './ui/dashboard.js';
import * as madplan from './ui/madplan.js';
import * as opskrifter from './ui/opskrifter.js';
import * as indkob from './ui/indkobsside.js';
import * as mig from './ui/mig.js';
import * as idag from './ui/idag.js';
import * as uge from './ui/uge.js';
import { progression, historik } from './ui/udvikling.js';

/* Ikoner tegnes her, så navigationen kan bygges i JavaScript og skifte med sektionen. */
const I = d => `<svg class="ikon" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const IKONER = {
  idag: I('<rect x="3.6" y="5.2" width="16.8" height="15.2" rx="3"/><path d="M3.6 10h16.8M8.4 3.4v3.6M15.6 3.4v3.6"/><circle cx="12" cy="15" r="1.9"/>'),
  uge: I('<rect x="3.4" y="6" width="17.2" height="13" rx="3"/><path d="M8.2 10v5M12 9v7M15.8 11v4"/>'),
  progression: I('<path d="M4 18.5 9 12l4 3.5 6.5-9"/><path d="M15.5 6.5H20v4.4"/>'),
  historik: I('<circle cx="12" cy="12" r="8.4"/><path d="M12 7.4V12l3.2 2"/>'),
  oversigt: I('<circle cx="12" cy="12" r="8.2"/><path d="M12 3.8a8.2 8.2 0 0 1 7.4 4.7"/><circle cx="12" cy="12" r="2.6"/>'),
  madplan: I('<path d="M6.5 3.5v7a2.2 2.2 0 0 0 4.4 0v-7"/><path d="M8.7 10.5v10"/><path d="M17.3 3.5c-1.6 1-2.4 2.9-2.4 5.2 0 1.6.8 2.6 2.4 2.8v9"/>'),
  opskrifter: I('<path d="M4 4.8h6.2c1 0 1.8.8 1.8 1.8v12c0-1-.8-1.8-1.8-1.8H4z"/><path d="M20 4.8h-6.2c-1 0-1.8.8-1.8 1.8v12c0-1 .8-1.8 1.8-1.8H20z"/>'),
  indkob: I('<path d="M5.6 8h12.8l-1 11.2a1.8 1.8 0 0 1-1.8 1.6H8.4a1.8 1.8 0 0 1-1.8-1.6z"/><path d="M9 8V6.4a3 3 0 0 1 6 0V8"/>'),
  mig: I('<circle cx="12" cy="8.4" r="3.6"/><path d="M5 20.2c0-3.5 3.1-5.6 7-5.6s7 2.1 7 5.6"/>')
};

const MIG = { id: 'mig', navn: 'Mig', titel: 'Mig', under: 'Tal, indstillinger og fremskridt', modul: mig };

const SEKTIONER = [
  {
    id: 'traening',
    navn: 'Træning',
    sider: [
      { id: 'idag', navn: 'I dag', titel: 'I dag', under: () => `${tr.dagsnavn(tr.idag())} ${tr.datoTekst(tr.idag())}`, modul: idag },
      { id: 'uge', navn: 'Uge', titel: 'Ugen', under: 'Mandag til søndag', modul: uge },
      { id: 'progression', navn: 'Udvikling', titel: 'Progression', under: 'Bygget på dine egne tal', modul: progression },
      { id: 'historik', navn: 'Historik', titel: 'Historik', under: 'Det, du har gennemført', modul: historik },
      MIG
    ]
  },
  {
    id: 'mad',
    navn: 'Mad',
    sider: [
      { id: 'oversigt', navn: 'Oversigt', titel: 'Oversigt', under: 'Ugen på fem sekunder', modul: dashboard },
      { id: 'madplan', navn: 'Madplan', titel: 'Madplan', under: 'Din uge, én dag ad gangen', modul: madplan },
      { id: 'opskrifter', navn: 'Opskrifter', titel: 'Opskrifter', under: 'Alt du kan vælge imellem', modul: opskrifter },
      { id: 'indkob', navn: 'Indkøb', titel: 'Indkøb', under: 'Én liste, sorteret som butikken', modul: indkob },
      MIG
    ]
  }
];

const ALLE_SIDER = SEKTIONER.flatMap(s => s.sider.map(p => ({ ...p, sektion: s.id })));
const findSide = id => ALLE_SIDER.find(p => p.id === id);

let aktivSide = 'idag';
let aktivSektion = 'traening';

function tegn() {
  const side = findSide(aktivSide) || ALLE_SIDER[0];
  const sektion = SEKTIONER.find(s => s.id === aktivSektion) || SEKTIONER[0];

  $('#sidetitel').textContent = side.titel;
  $('#sideunder').textContent = typeof side.under === 'function' ? side.under() : side.under;

  tegnSektionsskift(sektion);
  tegnNav(sektion);

  const rod = $('#indhold');
  rod.innerHTML = side.modul.html();
  side.modul.bind?.(rod);
  bindFaelles(rod);
}

function tegnSektionsskift(sektion) {
  const boks = $('#sektionsskift');
  if (boks.dataset.aktiv === sektion.id) return;
  boks.dataset.aktiv = sektion.id;
  boks.innerHTML = SEKTIONER.map(s =>
    `<button data-sektion="${s.id}" aria-pressed="${s.id === sektion.id}">${s.navn}</button>`).join('');
  boks.querySelectorAll('[data-sektion]').forEach(b =>
    b.addEventListener('click', () => skiftSektion(b.dataset.sektion)));
}

function tegnNav(sektion) {
  const nav = $('.bundnav');
  const noegle = sektion.id;
  if (nav.dataset.sektion !== noegle) {
    nav.dataset.sektion = noegle;
    nav.innerHTML = `<span class="mrk">Slankemad</span>` + sektion.sider.map(p => `
      <button role="tab" data-side="${p.id}" aria-selected="${p.id === aktivSide}">
        ${IKONER[p.id] || ''}<span class="navn">${p.navn}</span>
      </button>`).join('');
    nav.querySelectorAll('[data-side]').forEach(b =>
      b.addEventListener('click', () => skiftTil(b.dataset.side)));
  }
  nav.querySelectorAll('[data-side]').forEach(b =>
    b.setAttribute('aria-selected', b.dataset.side === aktivSide ? 'true' : 'false'));
}

function skiftSektion(id) {
  const s = SEKTIONER.find(x => x.id === id);
  if (!s) return;
  aktivSektion = id;
  // "Mig" er fælles — bliv stående, hvis man allerede er der.
  if (aktivSide !== 'mig') aktivSide = s.sider[0].id;
  if (id === 'traening') { idag.nulstilDag(); uge.nulstilUge(); }
  opdater(t => { t.sidsteSektion = id; }, { stille: true });
  gaaTil(aktivSide);
}

function skiftTil(id) {
  const side = findSide(id);
  if (!side) return skiftTil('idag');
  aktivSide = id;
  if (side.sektion !== 'delt') aktivSektion = side.sektion === 'traening' || side.sektion === 'mad' ? side.sektion : aktivSektion;
  if (id === 'mig') aktivSektion = hent().sidsteSektion || aktivSektion;
  gaaTil(id);
}

function gaaTil(id) {
  skjulToast();
  if (location.hash.slice(1) !== id) history.replaceState(null, '', `#${id}`);
  tegn();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/** Handlinger, der findes på flere sider. */
function bindFaelles(rod) {
  rod.querySelectorAll('[data-handling="lav-plan"]').forEach(b => b.addEventListener('click', () => {
    b.disabled = true;
    b.textContent = 'Bygger planen …';
    setTimeout(() => {
      opdater(t => { t.plan = lavPlan(t); t.koeb = {}; t.onboardet = true; });
      madplan.saetDag(0);
      skiftTil('madplan');
      toast('Din plan er klar');
    }, 20);
  }));
}

async function start() {
  // Kommer man tilbage fra login-linket, ligger tokenet i adressen.
  if (skyErOpsat() && sky.fangLoginFraUrl()) {
    try { await sky.hentBruger(); } catch { /* vises i grænsefladen */ }
  }

  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (findSide(id) && id !== aktivSide) skiftTil(id);
  });

  saetTegner(tegn);
  saetSkifter(skiftTil);
  abonner(() => tegn());

  const fra = location.hash.slice(1);
  const side = findSide(fra);
  if (side) {
    aktivSide = side.id;
    aktivSektion = side.sektion;
  }
  tegn();

  // Hent ændringer fra andre enheder i baggrunden. Fejler det, mærker man
  // ingenting — appen kører videre på den lokale kopi.
  if (skyErOpsat() && sky.erLoggetInd()) {
    sky.synkroniser().then(() => tegn()).catch(() => {});
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
