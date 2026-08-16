/**
 * GRAFER — én serie pr. graf, ét mål pr. graf.
 * Vægt og talje har hver sin graf frem for to akser i samme, fordi to
 * y-akser i ét diagram er den nemmeste måde at lyve med et kurveforløb.
 */

import { tal, esc } from './format.js';

export function linjegraf(punkter, { titel, enhed, farve = 'var(--serie-1)' }) {
  if (punkter.length < 2) {
    return `<figure class="graf">
      <figcaption>${esc(titel)} (${esc(enhed)})</figcaption>
      <p class="finprint">Der skal mindst to målinger til, før en kurve siger noget.</p>
    </figure>`;
  }

  const B = 520, H = 190, mv = 44, mh = 12, mo = 14, mn = 28;
  const ys = punkter.map(p => p.y);
  let min = Math.min(...ys), maks = Math.max(...ys);
  const luft = Math.max((maks - min) * 0.3, 0.5);
  min -= luft; maks += luft;

  const X = i => mv + (i / (punkter.length - 1)) * (B - mv - mh);
  const Y = v => mo + (1 - (v - min) / (maks - min)) * (H - mo - mn);

  const gitter = [0, 0.5, 1].map(t => {
    const v = min + t * (maks - min);
    return `<line class="gitter" x1="${mv}" x2="${B - mh}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>
      <text class="akse" x="${mv - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${tal(v, 1)}</text>`;
  }).join('');

  const linje = punkter.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
  const prikker = punkter.map((p, i) =>
    `<g><circle cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="4.5" fill="${farve}" stroke="var(--surface)" stroke-width="2"/>
      <title>${esc(p.x)}: ${tal(p.y, 1)} ${esc(enhed)}</title></g>`).join('');

  const foerst = punkter[0], sidst = punkter[punkter.length - 1];
  return `<figure class="graf">
    <figcaption>${esc(titel)} (${esc(enhed)})</figcaption>
    <svg viewBox="0 0 ${B} ${H}" role="img"
      aria-label="${esc(titel)} fra ${tal(foerst.y, 1)} ${esc(enhed)} den ${esc(foerst.x)} til ${tal(sidst.y, 1)} ${esc(enhed)} den ${esc(sidst.x)}.">
      ${gitter}
      <path d="${linje}" fill="none" stroke="${farve}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${prikker}
      <text class="akse" x="${mv}" y="${H - 8}">${esc(foerst.x)}</text>
      <text class="akse" x="${B - mh}" y="${H - 8}" text-anchor="end">${esc(sidst.x)}</text>
    </svg>
  </figure>`;
}
