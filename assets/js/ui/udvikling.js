/**
 * PROGRESSION og HISTORIK.
 *
 * To visninger, samme fil, fordi de deler alle byggeklodser. Begge bygger
 * udelukkende på registrerede data — er der intet registreret, står der det.
 */

import { hent, opdater } from '../core/state.js';
import * as tr from '../core/traening.js';
import { INTENSITETER } from '../data/traening.js';
import { linjegraf } from './graf.js';
import { visTraening } from './traeningsark.js';
import { ikon, saetDag } from './idag.js';
import { esc, tal, toast } from './format.js';
import { tegn, gaaTil } from './bus.js';

/* ==================================================================
   PROGRESSION
================================================================== */
export const progression = {
  html() {
    const t = hent();
    const noegletal = tr.noegletal(t);
    const forslag = tr.progressionsForslag(t);

    if (!noegletal.length) {
      return `<div class="tom">
        <span class="emoji">📈</span>
        <h3>Ingenting endnu — og det er som det skal være</h3>
        <p>Progressionen bygger kun på det, du selv registrerer. Log et par træninger, så begynder tallene at dukke op her.</p>
        <button class="knap" data-gaa="idag">Gå til i dag</button>
      </div>`;
    }

    return `
    ${forslag.length ? `
      <section class="blok">
        <div class="blok-hoved"><h2>Forslag</h2></div>
        ${forslag.map(f => `
          <div class="kort forslag">
            <p class="label">${esc(f.navn)} · ${esc(f.grundlag)}</p>
            <p style="font-size:14.5px;margin:6px 0 12px">${esc(f.tekst)}</p>
            <div class="knap-gruppe">
              <button class="knap lille" data-accepter="${esc(f.id)}">${esc(f.handling)}</button>
              <button class="knap tekst lille" data-afvis="${esc(f.id)}">Ikke endnu</button>
            </div>
          </div>`).join('')}
        <p class="finprint">Forslag ændrer aldrig din plan af sig selv. Der sker først noget, når du trykker.</p>
      </section>` : ''}

    ${noegletal.map(n => `
      <section class="blok">
        <div class="blok-hoved">
          <h2 style="font-size:16px">${esc(n.navn)}</h2>
          <span class="finprint">${n.serie.length} ${n.serie.length === 1 ? 'registrering' : 'registreringer'}</span>
        </div>
        <div class="kort" style="display:grid;gap:12px">
          <div style="display:flex;align-items:baseline;gap:10px">
            <span style="font-size:28px;font-weight:700" class="tal">${tal(n.nu, n.nu % 1 ? 1 : 0)}</span>
            <span class="muted">${esc(n.enhed || '')}</span>
            <span class="finprint" style="margin-left:auto">${retning(n)}</span>
          </div>
          ${n.serie.length >= 2
            ? linjegraf(n.serie.map(p => ({ x: kortDato(p.dato), y: p.vaerdi })), { titel: n.navn, enhed: n.enhed || '', farve: 'var(--serie-1)' })
            : `<p class="finprint">Der skal to registreringer til, før en kurve siger noget.</p>`}
        </div>
      </section>`).join('')}

    <p class="finprint">Alle tal er dine egne registreringer. Der beregnes ikke kondital, VO2 max, forbrændte kalorier eller træningsbelastning — de tal ville være gæt.</p>`;
  },

  bind(rod) {
    rod.querySelectorAll('[data-accepter]').forEach(b => b.addEventListener('click', () => {
      opdater(t => { tr.accepterForslag(t, b.dataset.accepter); });
      toast('Sat i gang');
    }));
    rod.querySelectorAll('[data-afvis]').forEach(b => b.addEventListener('click', () => {
      opdater(t => { tr.afvisForslag(t, b.dataset.afvis); });
    }));
    rod.querySelectorAll('[data-gaa]').forEach(b => b.addEventListener('click', () => gaaTil(b.dataset.gaa)));
  }
};

const retning = n => {
  if (n.serie.length < 2) return 'Første registrering';
  const d = n.nu - n.foer;
  if (d === 0) return 'Uændret siden start';
  return `${d > 0 ? '↑' : '↓'} ${tal(Math.abs(d), Math.abs(d) % 1 ? 1 : 0)} siden start`;
};

const kortDato = dato => {
  const d = new Date(`${dato}T12:00:00`);
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
};

/* ==================================================================
   HISTORIK
================================================================== */
export const historik = {
  html() {
    const t = hent();
    const poster = tr.historik(t, 60);

    if (!poster.length) {
      return `<div class="tom">
        <span class="emoji">🗓️</span>
        <h3>Historikken er tom</h3>
        <p>Der er ikke lagt træninger ind på forhånd. Alt her er noget, du selv har registreret.</p>
        <button class="knap" data-gaa="idag">Gå til i dag</button>
      </div>`;
    }

    // Grupperet på uge, nyeste først
    const uger = new Map();
    for (const s of poster) {
      const m = tr.mandagI(s.dato);
      if (!uger.has(m)) uger.set(m, []);
      uger.get(m).push(s);
    }

    return [...uger.entries()].map(([mandag, liste]) => {
      const gennemfoert = liste.filter(s => s.status === 'gennemfoert').length;
      const minutter = liste.reduce((a, s) => a + (s.varighed || 0), 0);
      const gaa = tr.gaature(t).filter(g => tr.mandagI(g.dato) === mandag);
      return `
      <section class="blok">
        <div class="blok-hoved">
          <h2 style="font-size:16px">${mandag === tr.mandagI(tr.idag()) ? 'Denne uge' : `Uge fra ${esc(tr.datoTekst(mandag))}`}</h2>
          <span class="finprint">${gennemfoert} ${gennemfoert === 1 ? 'træning' : 'træninger'}${minutter ? ` · ${tal(minutter)} min` : ''}</span>
        </div>
        <div class="liste">
          ${liste.map(s => post(s)).join('')}
        </div>
        ${gaa.length ? `<p class="finprint">${gaa.length} ${gaa.length === 1 ? 'gåtur' : 'gåture'} · ${tal(gaa.reduce((a, g) => a + g.minutter, 0))} min</p>` : ''}
      </section>`;
    }).join('');
  },

  bind(rod) {
    rod.querySelectorAll('[data-aabn]').forEach(b => b.addEventListener('click', () => {
      saetDag(b.dataset.aabn);
      visTraening(b.dataset.aabn);
    }));
    rod.querySelectorAll('[data-gaa]').forEach(b => b.addEventListener('click', () => gaaTil(b.dataset.gaa)));
  }
};

function post(s) {
  const dele = [];
  if (Number.isFinite(s.varighed)) dele.push(`${s.varighed} min`);
  if (s.intensitet) dele.push(INTENSITETER[s.intensitet]?.navn || s.intensitet);
  if (Number.isFinite(s.intervaller)) dele.push(`${s.intervaller} intervaller`);
  const saet = tr.saetListe(s).length;
  if (saet) dele.push(`${saet} sæt`);

  return `<button class="liste-raekke" data-aabn="${s.dato}">
    <span class="raekke-ikon" aria-hidden="true">${ikon(s.snapshot?.type)}</span>
    <span class="raekke-tekst">
      <span class="raekke-titel">${esc(s.snapshot?.navn || 'Træning')}</span>
      <span class="raekke-under">${esc(tr.dagsnavn(s.dato))} ${esc(tr.datoTekst(s.dato))}${dele.length ? ` · ${esc(dele.join(' · '))}` : ''}</span>
      ${s.note ? `<span class="raekke-note">${esc(s.note)}</span>` : ''}
    </span>
    <span class="raekke-status ${s.status}">${s.status === 'gennemfoert' ? '✓' : '–'}</span>
  </button>`;
}
