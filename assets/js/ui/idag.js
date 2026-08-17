/**
 * I DAG — den vigtigste skærm i træningsdelen.
 * Rækkefølge: dagens træning, ugen, progression, seneste træninger.
 * Ingen grafer øverst.
 */

import { hent, opdater } from '../core/state.js';
import * as tr from '../core/traening.js';
import { TYPER, INTENSITETER, SENERE } from '../data/traening.js';
import { visTraening } from './traeningsark.js';
import { tal, esc, toast } from './format.js';
import { tegn, gaaTil } from './bus.js';

/* Dagen, der vises. Kan flyttes, men starter altid på i dag. */
let vist = tr.idag();
export const saetDag = d => { vist = d; };
export const nulstilDag = () => { vist = tr.idag(); };

const STATUS_MAERKE = {
  planlagt: '',
  igang: 'I gang',
  gennemfoert: 'Gennemført',
  sprunget: 'Sprunget over'
};

export function html() {
  const t = hent();
  const dato = vist;
  const plan = tr.planFor(dato);
  const session = tr.sessionFor(t, dato);
  const status = session?.status || tr.STATUS.planlagt;
  const gaatur = tr.gaaturFor(t, dato);
  const erIdag = dato === tr.idag();
  const balance = tr.ugensBalance(t, dato);
  const forslag = tr.progressionsForslag(t);
  const noegletal = tr.noegletal(t).slice(0, 3);
  const seneste = tr.historik(t, 3);

  return `
  ${erIdag ? '' : `<button class="knap sek lille" data-idag>← Tilbage til i dag</button>`}

  <section class="kort dagskort ${status === 'gennemfoert' ? 'faerdig' : ''}">
    <div class="dagskort-top">
      <div>
        <p class="label">${esc(plan.navn)} · ${esc(tr.datoTekst(dato))}</p>
        <h2 class="dagskort-titel">${esc(plan.skabelon.navn)}</h2>
      </div>
      ${STATUS_MAERKE[status] ? `<span class="badge ${status}">${STATUS_MAERKE[status]}</span>` : ''}
    </div>

    <div class="maerkater">
      <span class="maerke">${esc(TYPER[plan.skabelon.type].navn)}</span>
      <span class="maerke intensitet-${plan.skabelon.intensitet}">${esc(INTENSITETER[plan.skabelon.intensitet].navn)}</span>
      <span class="maerke">${varighedTekst(plan.skabelon)}</span>
      ${plan.skabelon.tidspunkt ? `<span class="maerke">${esc(plan.skabelon.tidspunkt)}</span>` : ''}
      ${niveauMaerke(t, plan.skabelon)}
    </div>

    <p class="dagskort-resume">${esc(plan.skabelon.resume)}</p>

    ${status === 'gennemfoert' ? resultat(session) : ''}

    <div class="knap-gruppe dagskort-handling">
      ${status === 'gennemfoert'
        ? `<button class="knap" data-aabn>Se og ret registreringen</button>
           <button class="knap tekst" data-status="planlagt">Fortryd</button>`
        : `<button class="knap" data-faerdig>Markér som gennemført</button>
           <button class="knap sek" data-aabn>Åbn træningen</button>`}
    </div>
    ${status !== 'gennemfoert' && status !== 'sprunget'
      ? `<button class="mini" data-status="sprunget" style="justify-self:start">Sprang den over</button>`
      : ''}
    ${status === 'sprunget'
      ? `<p class="finprint">Sprunget over. Det sker — ugen er ikke ødelagt af én træning.
         <button class="mini" data-status="planlagt">Fortryd</button></p>`
      : ''}
  </section>

  ${gaaturKort(plan, gaatur)}

  <section class="blok">
    <div class="blok-hoved">
      <h2>Ugen</h2>
      <button class="link" data-gaa="uge">Se hele ugen</button>
    </div>
    <div class="ugestribe">
      ${balance.dage.map(d => dagsknap(d, dato)).join('')}
    </div>
    <p class="finprint">${balance.gennemfoert} af ${balance.planlagt} træninger gennemført${balance.gaaDage ? ` · ${balance.gaaDage} ${balance.gaaDage === 1 ? 'gåtur' : 'gåture'} registreret` : ''}.</p>
  </section>

  ${forslag.length ? `
  <section class="blok">
    <div class="blok-hoved"><h2>Klar til næste skridt</h2></div>
    ${forslag.map(f => `
      <div class="kort forslag">
        <p class="label">${esc(f.navn)} · ${esc(f.grundlag)}</p>
        <p style="font-size:14.5px;margin:6px 0 12px">${esc(f.tekst)}</p>
        <div class="knap-gruppe">
          <button class="knap lille" data-accepter="${esc(f.id)}">${esc(f.handling)}</button>
          <button class="knap tekst lille" data-afvis="${esc(f.id)}">Ikke endnu</button>
        </div>
      </div>`).join('')}
  </section>` : ''}

  <section class="blok">
    <div class="blok-hoved">
      <h2>Din progression</h2>
      ${noegletal.length ? `<button class="link" data-gaa="progression">Se mere</button>` : ''}
    </div>
    ${noegletal.length ? `
      <div class="stats">
        ${noegletal.map(n => `
          <div class="stat">
            <span class="label">${esc(n.navn)}</span>
            <span class="stat-vaerdi tal">${tal(n.nu, n.nu % 1 ? 1 : 0)}${n.enhed ? `<small>${esc(n.enhed)}</small>` : ''}</span>
            <span class="stat-note">${udvikling(n)}</span>
          </div>`).join('')}
      </div>`
      : `<div class="kort"><p class="finprint">Der er ikke registreret noget endnu. Progressionen dukker op, så snart du har logget et par træninger — den bygger kun på dine egne tal.</p></div>`}
  </section>

  <section class="blok">
    <div class="blok-hoved">
      <h2>Seneste træninger</h2>
      ${seneste.length ? `<button class="link" data-gaa="historik">Se historik</button>` : ''}
    </div>
    ${seneste.length ? `<div class="liste">${seneste.map(s => historikRaekke(s)).join('')}</div>`
      : `<div class="kort"><p class="finprint">Historikken er tom. Den fyldes af det, du registrerer — der er ikke lagt noget ind på forhånd.</p></div>`}
  </section>

  <section class="blok">
    <div class="blok-hoved"><h2>Senere</h2></div>
    <div class="kort">
      <p style="font-weight:650;font-size:14.5px">${esc(SENERE.navn)}</p>
      <p class="finprint" style="margin-top:4px">${esc(SENERE.resume)} ${esc(SENERE.begrundelse)}</p>
      <p class="finprint" style="margin-top:6px">Mulige øvelser: ${SENERE.oevelser.map(esc).join(' · ')}.</p>
    </div>
  </section>`;
}

/* ---------------- byggeklodser ---------------- */

function varighedTekst(s) {
  if (s.varighedMin && s.varighedMaks) return `${s.varighedMin}-${s.varighedMaks} min`;
  return `${s.varighed} min`;
}

function niveauMaerke(t, skabelon) {
  const n = tr.aktivtNiveau(t, skabelon.id);
  return n ? `<span class="maerke">${esc(n.navn)}</span>` : '';
}

function resultat(session) {
  const dele = [];
  if (Number.isFinite(session.varighed)) dele.push(`${session.varighed} min`);
  if (session.intensitet) dele.push(INTENSITETER[session.intensitet]?.navn || session.intensitet);
  if (Number.isFinite(session.intervaller)) dele.push(`${session.intervaller} intervaller`);
  const vaegte = Object.entries(session.vaegte || {}).filter(([, v]) => Number.isFinite(Number(v)));
  const saet = (session.saet || []).length;

  return `<div class="resultat">
    <p class="label">Sådan gik det</p>
    ${dele.length ? `<p class="resultat-tal tal">${dele.map(esc).join(' · ')}</p>` : ''}
    ${vaegte.length ? `<p class="finprint">${vaegte.map(([k, v]) => `${esc(k)}: ${tal(v, Number(v) % 1 ? 1 : 0)} kg`).join(' · ')}</p>` : ''}
    ${saet ? `<p class="finprint">${saet} registrerede sæt</p>` : ''}
    ${session.note ? `<p class="tip" style="margin-top:8px">${esc(session.note)}</p>` : ''}
    ${!dele.length && !vaegte.length && !saet && !session.note
      ? `<p class="finprint">Registreret som gennemført. Åbn træningen, hvis du vil skrive tal på.</p>` : ''}
  </div>`;
}

function gaaturKort(plan, gaatur) {
  if (!plan.gaatur && !plan.gaaturValgfri && !gaatur) return '';
  const logget = !!gaatur;
  const foreslaaet = plan.gaatur || 60;
  return `<section class="kort gaatur ${logget ? 'logget' : ''}">
    <div class="gaatur-tekst">
      <p class="label">Gåtur${plan.gaaturErTraeningen ? ' · dagens træning' : ' · rolig aktivitet'}</p>
      <p style="font-weight:650">${logget ? `${gaatur.minutter} minutter registreret` : `Cirka ${foreslaaet} minutter`}</p>
      ${!logget ? `<p class="finprint">Tæller med som aktivitet — ikke som endnu en hård træning.</p>` : ''}
    </div>
    <div class="knap-gruppe">
      ${logget
        ? `<button class="mini" data-gaatur="0">Fjern</button>`
        : `<button class="knap sek lille" data-gaatur="${foreslaaet}">Registrér ${foreslaaet} min</button>`}
    </div>
  </section>`;
}

function dagsknap(d, valgt) {
  const klar = d.status === 'gennemfoert';
  const sprunget = d.status === 'sprunget';
  return `<button class="ugedag ${klar ? 'klar' : ''} ${sprunget ? 'sprunget' : ''}"
      data-dag="${d.dato}" aria-current="${d.dato === valgt ? 'date' : 'false'}"
      aria-label="${esc(d.navn)}: ${esc(d.vist?.navn || '')}, ${esc(tr.STATUS_NAVN[d.status])}">
    <span class="u-navn">${esc(d.navn.slice(0, 3))}</span>
    <span class="u-ikon" aria-hidden="true">${ikon(d.vist?.type)}</span>
    <span class="u-status" aria-hidden="true">${klar ? '✓' : sprunget ? '–' : ''}</span>
  </button>`;
}

/** Ét lille ikon pr. træningstype — form frem for farve, så det virker uden farvesyn. */
export function ikon(type) {
  const s = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
  if (type === 'styrke') return `<svg ${s}><path d="M4 9v6M20 9v6M7 6v12M17 6v12M7 12h10"/></svg>`;
  if (type === 'hjemme') return `<svg ${s}><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V19h11v-8.5"/></svg>`;
  if (type === 'lob') return `<svg ${s}><circle cx="15" cy="5.5" r="2"/><path d="M8 20l3-5 3 2 1 3M6 12l4-3 4 1 2 3"/></svg>`;
  if (type === 'interval') return `<svg ${s}><path d="M3 17l4-8 4 5 3-9 4 12"/></svg>`;
  return `<svg ${s}><path d="M3 12h4l2-4 3 8 2-5 2 1h5"/></svg>`;
}

function udvikling(n) {
  if (n.serie.length < 2) return 'Første registrering';
  const d = n.nu - n.foer;
  if (d === 0) return 'Uændret siden start';
  const retning = d > 0 ? '↑' : '↓';
  return `${retning} ${tal(Math.abs(d), Math.abs(d) % 1 ? 1 : 0)} ${esc(n.enhed || '')} siden start`.trim();
}

function historikRaekke(s) {
  const type = s.snapshot?.type;
  return `<button class="liste-raekke" data-dag="${s.dato}">
    <span class="raekke-ikon" aria-hidden="true">${ikon(type)}</span>
    <span class="raekke-tekst">
      <span class="raekke-titel">${esc(s.snapshot?.navn || 'Træning')}</span>
      <span class="raekke-under">${esc(tr.dagsnavn(s.dato))} ${esc(tr.datoTekst(s.dato))}${Number.isFinite(s.varighed) ? ` · ${s.varighed} min` : ''}</span>
    </span>
    <span class="raekke-status ${s.status}">${s.status === 'gennemfoert' ? '✓' : '–'}</span>
  </button>`;
}

/* ---------------- binding ---------------- */

export function bind(rod) {
  rod.querySelector('[data-idag]')?.addEventListener('click', () => { vist = tr.idag(); tegn(); });

  rod.querySelectorAll('[data-dag]').forEach(b => b.addEventListener('click', () => {
    vist = b.dataset.dag;
    tegn();
  }));

  rod.querySelector('[data-faerdig]')?.addEventListener('click', () => {
    opdater(t => { tr.saetStatus(t, vist, tr.STATUS.gennemfoert); });
    toast('Gennemført');
  });

  rod.querySelectorAll('[data-status]').forEach(b => b.addEventListener('click', () => {
    opdater(t => { tr.saetStatus(t, vist, b.dataset.status); });
  }));

  rod.querySelector('[data-aabn]')?.addEventListener('click', () => visTraening(vist));

  rod.querySelectorAll('[data-gaatur]').forEach(b => b.addEventListener('click', () => {
    const min = Number(b.dataset.gaatur);
    opdater(t => { tr.gemGaatur(t, vist, min); });
    toast(min ? `${min} minutters gåtur registreret` : 'Gåturen er fjernet');
  }));

  rod.querySelectorAll('[data-accepter]').forEach(b => b.addEventListener('click', () => {
    opdater(t => { tr.accepterForslag(t, b.dataset.accepter); });
    toast('Sat i gang');
  }));

  rod.querySelectorAll('[data-afvis]').forEach(b => b.addEventListener('click', () => {
    opdater(t => { tr.afvisForslag(t, b.dataset.afvis); });
  }));

  rod.querySelectorAll('[data-gaa]').forEach(b => b.addEventListener('click', () => gaaTil(b.dataset.gaa)));
}
