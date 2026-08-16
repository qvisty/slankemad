/**
 * INDKØB — én samlet liste, grupperet som butikken er skruet sammen.
 */

import { hent, opdater } from '../core/state.js';
import { byggListe, maengdeTekst, somTekst } from '../core/indkob.js';
import { esc, tal, toast } from './format.js';
import { tegn } from './bus.js';

let gruppering = 'afdeling';

export function html() {
  const t = hent();
  if (!t.plan?.dage?.length) {
    return `<div class="tom">
      <span class="emoji">🛒</span>
      <h3>Listen skriver sig selv</h3>
      <p>Lav en madplan først — så lægger appen alle råvarer sammen og sorterer dem efter afdeling.</p>
      <button class="knap" data-handling="lav-plan">Lav min madplan</button>
    </div>`;
  }

  const liste = byggListe(t, { grupperEfter: gruppering });
  const koebt = Object.values(t.koeb).filter(Boolean).length;

  return `
  <div class="kort" style="display:grid;gap:12px">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <div>
        <p style="font-size:26px;font-weight:700" class="tal">${liste.antal - koebt}<span style="font-size:14px;font-weight:600;color:var(--text-muted)"> varer tilbage</span></p>
        <p class="finprint">${t.plan.dage.length} dage · ${t.valg.personer} ${t.valg.personer > 1 ? 'personer' : 'person'} · ${liste.retter} retter</p>
      </div>
      ${koebt ? `<button class="mini" data-handling="ryd">Ryd flueben</button>` : ''}
    </div>
    <div class="segment">
      <button data-gruppe="afdeling" aria-pressed="${gruppering === 'afdeling'}">Efter afdeling</button>
      <button data-gruppe="opskrift" aria-pressed="${gruppering === 'opskrift'}">Efter ret</button>
    </div>
    <div class="knap-gruppe">
      <button class="knap sek lille" data-handling="kopier">Kopiér listen</button>
      <button class="knap sek lille" data-handling="print">Print</button>
    </div>
  </div>

  ${liste.grupper.map(g => `
    <section class="gruppe">
      <h3>${g.emoji} ${esc(g.navn)}</h3>
      ${g.varer.map(l => `
        <label class="vare ${t.koeb[l.noegle] ? 'koebt' : ''}">
          <input type="checkbox" data-vare="${esc(l.noegle)}" ${t.koeb[l.noegle] ? 'checked' : ''}>
          <span class="m">${esc(maengdeTekst(l))}</span>
          <span class="n">${esc(l.navn)}
            ${l.enh !== 'stk' && l.pakker > 1 ? `<em>ca. ${l.pakker} pakker à ${esc(maengdeTekst({ enh: l.enh, maengde: l.pakke }))}</em>` : ''}
            ${l.alt ? `<em>${esc(l.alt)}</em>` : ''}
          </span>
        </label>`).join('')}
    </section>`).join('')}

  ${liste.fast.length ? `
    <section class="gruppe">
      <h3>🧂 Tjek skabet</h3>
      <div class="kort">
        <p class="finprint" style="margin-bottom:8px">Krydderier, olie og saucer, planen bruger lidt af. De står ikke på listen — slå dem til under Mig, hvis du vil købe dem med.</p>
        <div class="maerkater">${liste.fast.map(l => `<span class="maerke">${esc(l.navn)}</span>`).join('')}</div>
      </div>
    </section>` : ''}

  <p class="finprint" style="margin-top:8px">
    Pakkestørrelserne er dem, varerne typisk sælges i hos REMA 1000. Appen viser med vilje ingen priser:
    der findes ikke en åben, kontrollerbar priskilde at hente dem fra, og gættede priser er værre end ingen.
  </p>`;
}

export function bind(rod) {
  rod.querySelectorAll('[data-vare]').forEach(el => el.addEventListener('change', () => {
    const n = el.dataset.vare;
    opdater(t => { t.koeb[n] = el.checked; }, { stille: true });
    el.closest('.vare').classList.toggle('koebt', el.checked);
    const tilbage = rod.querySelector('[data-tilbage]');
    if (tilbage) tilbage.textContent = tal(Number(tilbage.dataset.antal) - Object.values(hent().koeb).filter(Boolean).length);
  }));

  rod.querySelectorAll('[data-gruppe]').forEach(b => b.addEventListener('click', () => {
    gruppering = b.dataset.gruppe;
    tegn();
  }));

  rod.querySelector('[data-handling="ryd"]')?.addEventListener('click', () => {
    opdater(t => { t.koeb = {}; });
    toast('Fluebenene er ryddet');
  });

  rod.querySelector('[data-handling="print"]')?.addEventListener('click', () => window.print());

  rod.querySelector('[data-handling="kopier"]')?.addEventListener('click', async () => {
    const tekst = `INDKØB – REMA 1000\n${hent().plan.dage.length} dage · ${hent().valg.personer} personer\n\n`
      + somTekst(byggListe(hent(), { grupperEfter: gruppering }));
    try {
      await navigator.clipboard.writeText(tekst);
      toast('Listen er kopieret');
    } catch {
      toast('Kunne ikke kopiere — prøv Print i stedet');
    }
  });
}
