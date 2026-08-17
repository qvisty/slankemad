/**
 * APP-SKAL — navigation, gentegning og de handlinger, der findes på flere sider.
 * Al forretningslogik ligger i core/, alt indhold i data/, alt visning i ui/.
 */

import { hent, opdater, abonner } from './core/state.js';
import { lavPlan } from './core/plan.js';
import { saetTegner, saetSkifter } from './ui/bus.js';
import { $, toast } from './ui/format.js';
import * as dashboard from './ui/dashboard.js';
import * as madplan from './ui/madplan.js';
import * as opskrifter from './ui/opskrifter.js';
import * as indkob from './ui/indkobsside.js';
import * as mig from './ui/mig.js';

const SIDER = [
  { id: 'oversigt',  navn: 'Oversigt',   ikon: '◎', titel: 'Oversigt',   under: 'Ugen på fem sekunder',        modul: dashboard },
  { id: 'madplan',   navn: 'Madplan',    ikon: '🍽', titel: 'Madplan',    under: 'Din uge, én dag ad gangen',   modul: madplan },
  { id: 'opskrifter', navn: 'Opskrifter', ikon: '📖', titel: 'Opskrifter', under: 'Alt du kan vælge imellem',    modul: opskrifter },
  { id: 'indkob',    navn: 'Indkøb',     ikon: '🛒', titel: 'Indkøb',     under: 'Én liste, sorteret som butikken', modul: indkob },
  { id: 'mig',       navn: 'Mig',        ikon: '👤', titel: 'Mig',        under: 'Tal, indstillinger og fremskridt', modul: mig }
];

let aktiv = 'oversigt';

function tegn() {
  const side = SIDER.find(s => s.id === aktiv) || SIDER[0];
  const rod = $('#indhold');
  const titel = $('#sidetitel');
  const under = $('#sideunder');

  titel.textContent = side.titel;
  under.textContent = side.under;
  rod.innerHTML = side.modul.html();
  side.modul.bind?.(rod);
  bindFaelles(rod);

  document.querySelectorAll('.bundnav button').forEach(b =>
    b.setAttribute('aria-selected', b.dataset.side === aktiv ? 'true' : 'false'));
}

function skiftTil(id) {
  if (!SIDER.some(s => s.id === id)) id = 'oversigt';
  aktiv = id;
  if (location.hash.slice(1) !== id) history.replaceState(null, '', `#${id}`);
  tegn();
  document.querySelector('.app')?.scrollIntoView({ block: 'start' });
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/** Handlinger, der findes på flere sider. */
function bindFaelles(rod) {
  rod.querySelectorAll('[data-handling="lav-plan"]').forEach(b => b.addEventListener('click', () => {
    b.disabled = true;
    b.textContent = 'Bygger planen …';
    // Lad browseren nå at tegne knappens tilstand, før beregningen går i gang.
    setTimeout(() => {
      opdater(t => { t.plan = lavPlan(t); t.koeb = {}; t.onboardet = true; });
      madplan.saetDag(0);
      skiftTil('madplan');
      toast('Din plan er klar');
    }, 20);
  }));
}

function start() {
  document.querySelectorAll('.bundnav button').forEach(b =>
    b.addEventListener('click', () => skiftTil(b.dataset.side)));

  window.addEventListener('hashchange', () => skiftTil(location.hash.slice(1)));

  saetTegner(tegn);
  saetSkifter(skiftTil);
  abonner(() => tegn());

  const fra = location.hash.slice(1);
  aktiv = SIDER.some(s => s.id === fra) ? fra : (hent().plan ? 'oversigt' : 'oversigt');
  tegn();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
