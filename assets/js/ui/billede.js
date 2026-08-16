/**
 * MADBILLEDER
 *
 * Hver ret får sit eget billede, tegnet ud fra rettens egne råvarer: en
 * tallerken set oppefra, med farvede klatter for hver hovedingrediens.
 *
 * Hvorfor ikke fotos? Fordi appen skal kunne køre som en ren statisk side uden
 * eksterne kald, uden billedrettigheder og uden at vente på et CDN. Billedet er
 * deterministisk — samme ret giver altid præcis samme billede.
 */

import { VARER } from '../data/varer.js';

/* Lille deterministisk tilfældighedsgenerator, så billedet ikke hopper rundt. */
function fro(tekst) {
  let h = 2166136261;
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hvilke råvarer er værd at tegne? De store, de farverige — ikke krydderierne. */
function hovedraavarer(o, maks = 6) {
  return o.ing
    .map(([noegle, maengde]) => ({ v: VARER[noegle], noegle, maengde }))
    .filter(x => x.v && !x.v.fast)
    .map(x => ({
      ...x,
      vaegt: x.v.enh === 'stk' ? x.maengde * 90 : x.maengde
    }))
    .sort((a, b) => b.vaegt - a.vaegt)
    .slice(0, maks);
}

const FORM = {
  kod: 'stykker', kol: 'klatter', groent: 'blade',
  frost: 'kugler', brod: 'stykker', kolonial: 'korn', andet: 'korn'
};

/* Meget lyse råvarer forsvinder på en lys tallerken. De får en anelse mere
   farve, så mælkeprodukter og fisk stadig kan ses. */
function synlig(hex) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lys = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lys > 0.86) {
    const k = 0.88;
    r = Math.round(r * k); g = Math.round(g * k); b = Math.round(b * (k - 0.05));
  }
  return `#${[r, g, b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('')}`;
}

const KANT = 'rgba(52,38,24,.13)';

function tegnBid(x, y, farve, form, s, drej) {
  const f = `fill="${farve}" stroke="${KANT}" stroke-width="1"`;
  const t = `transform="rotate(${drej} ${x.toFixed(1)} ${y.toFixed(1)})"`;
  if (form === 'blade') {
    return `<path d="M${x.toFixed(1)} ${(y - s).toFixed(1)} C${(x + s * 1.15).toFixed(1)} ${(y - s * 0.45).toFixed(1)}, ${(x + s * 1.15).toFixed(1)} ${(y + s * 0.45).toFixed(1)}, ${x.toFixed(1)} ${(y + s).toFixed(1)} C${(x - s * 1.15).toFixed(1)} ${(y + s * 0.45).toFixed(1)}, ${(x - s * 1.15).toFixed(1)} ${(y - s * 0.45).toFixed(1)}, ${x.toFixed(1)} ${(y - s).toFixed(1)} Z" ${f} ${t}/>`;
  }
  if (form === 'stykker') {
    const b = s * 2.1, h = s * 1.25;
    return `<rect x="${(x - b / 2).toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${b.toFixed(1)}" height="${h.toFixed(1)}" rx="${(h * 0.4).toFixed(1)}" ${f} ${t}/>`;
  }
  if (form === 'klatter') {
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(s * 1.35).toFixed(1)}" ry="${(s * 1.05).toFixed(1)}" ${f} ${t}/>`;
  }
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(s * 0.95).toFixed(1)}" ${f}/>`;
}

/**
 * Tegner rettens billede som en SVG-streng.
 * @param {object} o opskrift
 * @param {{b?:number,h?:number}} maal viewBox-mål
 */
export function madSvg(o, { b = 400, h = 280 } = {}) {
  const rnd = fro(o.id);
  const raa = hovedraavarer(o);
  const hoved = raa[0]?.v?.farve || '#d9b579';

  const cx = b / 2;
  const cy = h * 0.54;
  const r = Math.min(b, h) * 0.36;
  const dybt = o.kategori === 'frokost' || o.kategori === 'snack';

  // Fordel bidderne efter hvor meget hver råvare fylder i retten, og læg dem
  // ud i en solsikkespiral, så tallerkenen bliver jævnt fyldt i stedet for at
  // have huller i midten.
  const ialt = raa.reduce((a, x) => a + x.vaegt, 0) || 1;
  const bidder = [];
  raa.forEach((x, i) => {
    const andel = Math.max(0.07, x.vaegt / ialt);
    const antal = Math.max(2, Math.min(11, Math.round(26 * andel)));
    for (let k = 0; k < antal; k++) bidder.push({ i, andel, v: x.v });
  });

  // Bland bidderne, så det ser ud som mad på en tallerken og ikke som et
  // lagkagediagram — men deterministisk, så billedet er det samme hver gang.
  for (let i = bidder.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [bidder[i], bidder[j]] = [bidder[j], bidder[i]];
  }

  const N = bidder.length;
  const fase = rnd() * Math.PI * 2;
  const klynger = bidder.map((bid, k) => {
    const afstand = r * 0.76 * Math.sqrt((k + 0.55) / N);
    const vinkel = k * 2.3999 + fase;
    const px = cx + Math.cos(vinkel) * afstand;
    const py = cy + Math.sin(vinkel) * afstand * 0.94;
    const s = r * (0.115 + Math.min(0.075, bid.andel * 0.22) + rnd() * 0.035);
    return tegnBid(px, py, synlig(bid.v.farve), FORM[bid.v.afd] || 'kugler', s, Math.round(rnd() * 360));
  }).join('');

  return `<svg viewBox="0 0 ${b} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration af ${o.navn}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg-${o.id}" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${hoved}" stop-opacity="0.20"/>
      <stop offset="1" stop-color="${hoved}" stop-opacity="0.42"/>
    </linearGradient>
    <radialGradient id="tal-${o.id}" cx="0.38" cy="0.32" r="0.8">
      <stop offset="0" stop-color="#fbf7ef"/>
      <stop offset="1" stop-color="#e6ddcb"/>
    </radialGradient>
    <clipPath id="klip-${o.id}"><circle cx="${cx}" cy="${cy}" r="${(r * 0.96).toFixed(1)}"/></clipPath>
  </defs>
  <rect width="${b}" height="${h}" fill="url(#bg-${o.id})"/>
  <ellipse cx="${cx}" cy="${(cy + r * 0.12).toFixed(1)}" rx="${(r * 1.06).toFixed(1)}" ry="${(r * 1.02).toFixed(1)}" fill="#2a231b" opacity="0.10"/>
  <circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="url(#tal-${o.id})"/>
  ${dybt ? `<circle cx="${cx}" cy="${cy}" r="${(r * 0.82).toFixed(1)}" fill="#000" opacity="0.05"/>` : ''}
  <g clip-path="url(#klip-${o.id})">${klynger}</g>
  <circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="2"/>
</svg>`;
}

/** Billedet som data-URI — bruges hvor et <img> er nemmere end inline SVG. */
export const madUrl = o => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(madSvg(o))}`;
