/**
 * OPSKRIFTSARK — detaljevisningen af én ret.
 * Bruges fra madplanen, opskriftslisten og dashboardet.
 */

import { VARER } from '../data/varer.js';
import { makro, maerkater, OPSKRIFT_INDEX } from '../core/ernaering.js';
import { hent, skiftFavorit, erFavorit, skiftFravalg, erFravalgt } from '../core/state.js';
import { maengdeTekst } from '../core/indkob.js';
import { madSvg } from './billede.js';
import { esc, tal, minutter, toast, $, $$ } from './format.js';
import { tegn } from './bus.js';

let dialog;

function sikrDialog() {
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.className = 'ark';
  dialog.innerHTML = '<div class="ark-indhold"></div>';
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  document.body.appendChild(dialog);
  return dialog;
}

/**
 * @param {string} id opskrift-id
 * @param {{portioner?:number, faktor?:number}} valg
 */
export function visOpskrift(id, { portioner, faktor = 1 } = {}) {
  const o = OPSKRIFT_INDEX[id];
  if (!o) return;
  const t = hent();
  const pers = portioner || Math.max(1, Number(t.valg.personer) || 1);
  const m = makro(o);
  const skala = (pers / o.basis) * faktor;

  const d = sikrDialog();
  d.querySelector('.ark-indhold').innerHTML = `
    <button class="ark-luk" data-luk aria-label="Luk">✕</button>
    <div class="ark-billede">${madSvg(o, { b: 400, h: 168 })}</div>
    <div class="ark-krop">
      <div>
        <p class="label">${esc(kategoriNavn(o.kategori))} · ${minutter(o.tid)}</p>
        <h2 style="font-size:23px;font-weight:700;margin-top:4px">${esc(o.navn)}</h2>
        ${o.kort ? `<p class="muted" style="margin-top:6px">${esc(o.kort)}</p>` : ''}
      </div>

      <div class="maerkater">
        ${maerkater(o).map(x => `<span class="maerke ${x.id}" title="${esc(x.titel)}">${esc(x.navn)}</span>`).join('')}
      </div>

      <div class="naering-blok">
        <div class="naering-tal">
          <b class="tal">${tal(m.kcal * faktor)}</b>
          <span>kcal pr. portion</span>
        </div>
        <div class="makrobars">
          ${makroLinje('Protein', m.p * faktor, 'var(--protein)')}
          ${makroLinje('Kulhydrat', m.k * faktor, 'var(--kulhydrat)')}
          ${makroLinje('Fedt', m.f * faktor, 'var(--fedt)')}
        </div>
      </div>
      <p class="finprint">${tal(m.fib * faktor, 1)} g fibre pr. portion${faktor !== 1 ? ` · portionen er skaleret ${tal(faktor, 2)}×, så dagen rammer dit mål` : ''}</p>

      <div>
        <div class="blok-hoved"><h3 style="font-size:16px">Ingredienser</h3><span class="finprint">${pers} ${pers === 1 ? 'portion' : 'portioner'}</span></div>
        <ul class="ingredienser">
          ${o.ing.map(([n, q]) => {
            const v = VARER[n];
            if (!v) return '';
            const maengde = v.enh === 'stk'
              ? Math.round(q * skala * 2) / 2
              : Math.max(1, Math.round(q * skala / 5) * 5);
            return `<li><span style="color:var(--text)">${esc(v.navn)}</span><span>${esc(maengdeTekst({ enh: v.enh, maengde }))}</span></li>`;
          }).join('')}
        </ul>
      </div>

      <div>
        <h3 style="font-size:16px;margin-bottom:12px">Sådan gør du</h3>
        <ol class="fremgang">${o.fremgang.map(f => `<li><span>${esc(f)}</span></li>`).join('')}</ol>
      </div>

      ${o.tip ? `<p class="tip">💡 ${esc(o.tip)}</p>` : ''}

      <div class="knap-gruppe">
        <button class="knap sek" data-favorit="${o.id}">${erFavorit(o.id) ? '♥ Favorit' : '♡ Gem som favorit'}</button>
        <button class="knap tekst" data-fravalg="${o.id}">${erFravalgt(o.id) ? 'Vis den igen' : 'Vis mig ikke denne ret'}</button>
      </div>
    </div>`;

  $$('[data-luk]', d).forEach(b => b.addEventListener('click', () => d.close()));
  $('[data-favorit]', d).addEventListener('click', e => {
    const nu = skiftFavorit(e.currentTarget.dataset.favorit);
    e.currentTarget.textContent = nu ? '♥ Favorit' : '♡ Gem som favorit';
    toast(nu ? 'Gemt som favorit' : 'Fjernet fra favoritter');
    tegn();
  });
  $('[data-fravalg]', d).addEventListener('click', e => {
    const nu = skiftFravalg(e.currentTarget.dataset.fravalg);
    e.currentTarget.textContent = nu ? 'Vis den igen' : 'Vis mig ikke denne ret';
    toast(nu ? 'Retten kommer ikke i nye planer' : 'Retten er med igen');
    tegn();
  });

  d.showModal();
  d.querySelector('.ark-indhold').scrollTop = 0;
}

/** Makroerne som bjælker, der kan sammenlignes — ikke fire lige store tal. */
function makroLinje(navn, gram, farve) {
  const kcal = gram * (navn === 'Fedt' ? 9 : 4);
  return `<div class="makro">
    <div class="makro-top">
      <span class="makro-navn"><i class="makro-prik" style="background:${farve}"></i>${navn}</span>
      <span class="makro-tal">${tal(gram)} g</span>
    </div>
    <div class="bar"><span style="width:${Math.min(100, (kcal / 900) * 100).toFixed(1)}%;background:${farve}"></span></div>
  </div>`;
}

export const kategoriNavn = k =>
  ({ morgenmad: 'Morgenmad', frokost: 'Frokost', aftensmad: 'Aftensmad', snack: 'Snack' }[k] || k);
