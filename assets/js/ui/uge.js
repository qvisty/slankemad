/**
 * UGEN — mandag til søndag på én skærm, og om ugen er i balance.
 */

import { hent, opdater } from '../core/state.js';
import * as tr from '../core/traening.js';
import { TYPER, INTENSITETER } from '../data/traening.js';
import { visTraening } from './traeningsark.js';
import { ikon, saetDag } from './idag.js';
import { esc, tal, toast } from './format.js';
import { tegn, gaaTil } from './bus.js';

let uge = tr.mandagI(tr.idag());

export const nulstilUge = () => { uge = tr.mandagI(tr.idag()); };

export function html() {
  const t = hent();
  const b = tr.ugensBalance(t, uge);
  const erDenneUge = uge === tr.mandagI(tr.idag());
  const sidste = tr.laegTil(uge, 6);

  return `
  <div class="uge-navigation">
    <button class="rund" data-uge="-7" aria-label="Forrige uge">←</button>
    <div class="uge-titel">
      <p style="font-weight:650">${erDenneUge ? 'Denne uge' : `${tr.datoTekst(uge)} – ${tr.datoTekst(sidste)}`}</p>
      <p class="finprint">${erDenneUge ? `${tr.datoTekst(uge)} – ${tr.datoTekst(sidste)}` : 'Tidligere uge'}</p>
    </div>
    <button class="rund" data-uge="7" aria-label="Næste uge">→</button>
  </div>

  <div class="liste">
    ${b.dage.map(d => dagsraekke(d)).join('')}
  </div>

  <section class="blok">
    <div class="blok-hoved"><h2>Ugens balance</h2></div>
    <div class="kort" style="display:grid;gap:14px">
      ${balancelinje('Styrke', b.styrke, b.styrkePlanlagt, 'BodyPump og hjemmetræning')}
      ${balancelinje('Kondition', b.kondition, b.konditionPlanlagt, 'Roligt løb og intervaller')}
      ${balancelinje('Restitution', b.restitution, b.restitutionPlanlagt, 'Planlagt rolig dag')}
      <div class="balance-fod">
        <div>
          <p class="label">Gåture</p>
          <p style="font-weight:650" class="tal">${b.gaaDage} ${b.gaaDage === 1 ? 'dag' : 'dage'}${b.gaaMinutter ? ` · ${tal(b.gaaMinutter)} min` : ''}</p>
        </div>
        <div>
          <p class="label">Tid trænet</p>
          <p style="font-weight:650" class="tal">${b.traeningsminutter ? `${tal(b.traeningsminutter)} min` : '—'}</p>
        </div>
      </div>
      ${b.sprunget ? `<p class="finprint">${b.sprunget} ${b.sprunget === 1 ? 'træning' : 'træninger'} sprunget over. Det ændrer ikke ugen nævneværdigt.</p>` : ''}
      <p class="finprint">Tallene tælles udelukkende på det, du har registreret. Der beregnes ingen belastning, ingen kalorier og intet kondital.</p>
    </div>
  </section>

  <section class="blok">
    <div class="blok-hoved"><h2>Værd at overveje</h2></div>
    <div class="kort" style="display:grid;gap:12px">
      <p class="finprint">Planen er lagt ind præcis som du har beskrevet den. En træningsfaglig gennemgang pegede på tre ting — de er forslag, ikke ændringer. Din plan er uændret, indtil du selv siger andet.</p>
      ${OVERVEJELSER.map(o => `
        <details class="guide-punkt">
          <summary>${esc(o.titel)}</summary>
          <p>${esc(o.tekst)}</p>
        </details>`).join('')}
    </div>
  </section>`;
}

const OVERVEJELSER = [
  {
    titel: 'Tirsdagens BodyPump giver mindre, end den koster',
    tekst: 'BodyPump er 800-1000 gentagelser på en time, og det er volumen og tid under spænding, der koster restitution — ikke vægten. At tage 10-20 % af stangen dagen efter mandag aflaster derfor ikke benene nævneværdigt, men koster stadig fuld restitution. Tre muligheder, hvis du vil gøre noget ved det: sid over på squat- og lunge-tracket om tirsdagen og træn kun overkrop, flyt timerne til mandag, onsdag og fredag med 48 timer imellem, eller byt tirsdagen ud med tung basistræning i fitnesslokalet på arbejdet.'
  },
  {
    titel: 'Ben og ryg er det, BodyPump belaster mindst',
    tekst: 'For en mand på 92 kg er den vægt, der kan komme på en pump-stang, langt under det, der udfordrer lår og balder mekanisk — det er brændingen og konditionen, der stopper dig, ikke benene. Overkrop, skuldre og arme får til gengæld reel stimulus. Én ugentlig tung træning med 5-8 gentagelser i fitnesslokalet på arbejdet er det enkeltgreb, der gør mest for at beholde muskelmassen, mens du taber dig — og det koster ikke ekstra tid, hvis den erstatter tirsdagen.'
  },
  {
    titel: 'Intervalløb fra uge 1 er planens største skadesrisiko',
    tekst: '92 kg, 42 år og tre ben-belastende hold om ugen: det er akillessene, lægge og svangsene, der giver op først — ikke konditionen. Overvej 3-4 uger med kun roligt løb, før intervallerne begynder, eller start med 4 × 1 minut ved 6 ud af 10 i stedet for 6 × 1 ved 7-8. Lægpres eller tåhævninger, 3 × 15-20 to gange om ugen, er den enkeltøvelse, der beskytter mest — den mangler i planen.'
  }
];

function dagsraekke(d) {
  const erIdag = d.dato === tr.idag();
  const s = d.vist;
  const status = d.status;
  return `<div class="ugeraekke ${status} ${erIdag ? 'idag' : ''}">
    <button class="ugeraekke-knap" data-aabn="${d.dato}">
      <span class="raekke-ikon" aria-hidden="true">${ikon(s?.type)}</span>
      <span class="raekke-tekst">
        <span class="raekke-titel">${esc(d.navn)}${erIdag ? ' · i dag' : ''}</span>
        <span class="raekke-under">${esc(s?.navn || '')} · ${esc(INTENSITETER[s?.intensitet]?.navn || '')}${s?.niveauNavn ? ` · ${esc(s.niveauNavn)}` : ''}</span>
      </span>
      <span class="raekke-status ${status}" title="${esc(tr.STATUS_NAVN[status])}">
        ${status === 'gennemfoert' ? '✓' : status === 'sprunget' ? '–' : status === 'igang' ? '•' : ''}
        <span class="skjult">${esc(tr.STATUS_NAVN[status])}</span>
      </span>
    </button>
    <div class="ugeraekke-fod">
      ${d.gaatur || d.gaaturValgfri || d.gaaturLog
        ? `<button class="mini ${d.gaaturLog ? 'aktiv' : ''}" data-gaatur="${d.dato}:${d.gaaturLog ? 0 : (d.gaatur || 60)}">
             ${d.gaaturLog ? `✓ Gåtur ${d.gaaturLog.minutter} min` : `+ Gåtur ${d.gaatur || 60} min`}
           </button>` : ''}
      ${status !== 'gennemfoert'
        ? `<button class="mini" data-faerdig="${d.dato}">Markér gennemført</button>`
        : `<button class="mini" data-planlagt="${d.dato}">Fortryd</button>`}
    </div>
  </div>`;
}

function balancelinje(navn, antal, planlagt, forklaring) {
  const pct = planlagt ? Math.min(100, (antal / planlagt) * 100) : 0;
  return `<div class="makro">
    <div class="makro-top">
      <span class="makro-navn">${esc(navn)}</span>
      <span class="makro-tal">${antal} af ${planlagt}</span>
    </div>
    <div class="bar"><span style="width:${pct.toFixed(0)}%;background:var(--accent)"></span></div>
    <p class="finprint">${esc(forklaring)}</p>
  </div>`;
}

export function bind(rod) {
  rod.querySelectorAll('[data-uge]').forEach(b => b.addEventListener('click', () => {
    uge = tr.laegTil(uge, Number(b.dataset.uge));
    tegn();
  }));

  rod.querySelectorAll('[data-aabn]').forEach(b => b.addEventListener('click', () => {
    saetDag(b.dataset.aabn);
    visTraening(b.dataset.aabn);
  }));

  rod.querySelectorAll('[data-faerdig]').forEach(b => b.addEventListener('click', () => {
    opdater(t => { tr.saetStatus(t, b.dataset.faerdig, tr.STATUS.gennemfoert); });
    toast('Gennemført');
  }));

  rod.querySelectorAll('[data-planlagt]').forEach(b => b.addEventListener('click', () => {
    opdater(t => { tr.saetStatus(t, b.dataset.planlagt, tr.STATUS.planlagt); });
  }));

  rod.querySelectorAll('[data-gaatur]').forEach(b => b.addEventListener('click', () => {
    const [dato, min] = b.dataset.gaatur.split(':');
    opdater(t => { tr.gemGaatur(t, dato, Number(min)); });
  }));
}
