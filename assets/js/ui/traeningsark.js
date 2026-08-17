/**
 * TRÆNINGSARK — én træning, åbnet i detaljer.
 * Her registreres sæt, vægte, varighed, intensitet og noter.
 * Alt gemmes med det samme; der er ingen "gem"-knap at glemme.
 */

import { hent, opdater } from '../core/state.js';
import * as tr from '../core/traening.js';
import { OEVELSE_INDEX, INTENSITETER, SKABELON_INDEX } from '../data/traening.js';
import { esc, tal, toast, $, $$ } from './format.js';
import { tegn } from './bus.js';
import { ikon } from './idag.js';
import { oevelsesBillede, typeBillede } from './oevelsesbillede.js';

let dialog;
let aktivDato = null;

function sikrDialog() {
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.className = 'ark';
  dialog.innerHTML = '<div class="ark-indhold"></div>';
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => tegn());
  document.body.appendChild(dialog);
  return dialog;
}

export function visTraening(dato) {
  aktivDato = dato;
  const d = sikrDialog();
  tegnArk();
  d.showModal();
  d.querySelector('.ark-indhold').scrollTop = 0;
}

/** Tegner arkets indhold igen — bruges når noget strukturelt ændrer sig. */
function tegnArk() {
  const t = hent();
  const dato = aktivDato;
  const plan = tr.planFor(dato);
  const session = tr.sessionFor(t, dato);
  const status = session?.status || tr.STATUS.planlagt;
  const laast = status === tr.STATUS.gennemfoert || status === tr.STATUS.sprunget;
  // Er træningen registreret, vises den som den var — ikke som planen er nu.
  const vis = tr.visning(t, dato);
  const s = laast ? { ...plan.skabelon, ...vis, id: vis.skabelonId } : plan.skabelon;
  const niveau = laast
    ? { id: vis.niveauId, navn: vis.niveauNavn, blokke: vis.blokke }
    : tr.aktivtNiveau(t, plan.skabelon.id);
  const d = sikrDialog();

  d.querySelector('.ark-indhold').innerHTML = `
    <button class="ark-luk" data-luk aria-label="Luk">✕</button>
    <div class="ark-krop">
      <div class="ark-hoved">
        <div class="ark-tegning type-${esc(s.type)}">${typeBillede(s.type)}</div>
        <p class="label">${esc(tr.dagsnavn(dato))} ${esc(tr.datoTekst(dato))}</p>
        <h2 style="font-size:23px;font-weight:700;margin-top:4px">${esc(s.navn)}</h2>
        <p class="muted" style="margin-top:6px">${esc(s.resume)}</p>
      </div>

      <div class="maerkater">
        <span class="maerke intensitet-${s.intensitet}">${esc(INTENSITETER[s.intensitet]?.navn || s.intensitet)}</span>
        <span class="maerke">${s.varighedMin && s.varighedMaks ? `${s.varighedMin}-${s.varighedMaks} min` : `${s.varighed} min`}</span>
        ${s.tidspunkt ? `<span class="maerke">${esc(s.tidspunkt)}</span>` : ''}
        ${(s.formaal || []).map(f => `<span class="maerke">${esc(f)}</span>`).join('')}
      </div>

      ${laast ? '' : niveauVaelger(s, niveau)}
      ${indhold(t, s, niveau, session, dato)}
      ${registrering(s, session, dato)}

      ${s.noter?.length ? `<div class="tip">${s.noter.map(n => `<p>${esc(n)}</p>`).join('')}</div>` : ''}

      <div class="ark-bund">
        ${status === 'gennemfoert'
          ? `<button class="knap sek bred" data-luk>Færdig</button>`
          : `<button class="knap bred" data-faerdig>Markér gennemført</button>
             <p class="finprint" style="text-align:center;margin-top:8px">Tallene tæller først med i din progression, når træningen er markeret gennemført.</p>`}
      </div>
    </div>`;

  bindArk(d);
}

/* ---------------- indhold pr. træningstype ---------------- */

function niveauVaelger(s, niveau) {
  if (!s.niveauer?.length || s.niveauer.length < 2) return '';
  return `<div>
    <p class="label" style="margin-bottom:6px">Variant</p>
    <div class="segment">
      ${s.niveauer.map(n => `
        <button data-niveau="${esc(n.id)}" aria-pressed="${n.id === niveau?.id}">${esc(n.navn)}</button>`).join('')}
    </div>
    ${niveau?.anbefaletUger ? `<p class="finprint" style="margin-top:6px">${esc(niveau.anbefaletUger)}. Niveauet skifter kun, når du selv vælger det.</p>` : ''}
    ${niveau?.beskrivelse ? `<p class="finprint" style="margin-top:6px">${esc(niveau.beskrivelse)}</p>` : ''}
  </div>`;
}

function indhold(t, s, niveau, session, dato) {
  if (s.type === 'hjemme') return hjemmetraening(t, s, session, dato);
  if (niveau?.blokke) return blokke(niveau, s);
  if (s.type === 'styrke') return bodypump(s);
  return '';
}

function blokke(niveau, s) {
  return `<div>
    <h3 class="ark-h3">Sådan ser den ud</h3>
    <ol class="blokke">
      ${niveau.blokke.map(b => `
        <li class="blok-raekke blok-${esc(b.type)}">
          <span class="blok-tid tal">${esc(b.spaend || `${b.minutter} min`)}</span>
          <span class="blok-navn">${esc(b.navn)}
            ${b.pause ? `<em>${b.arbejde} min hurtigt · ${b.pause} min ${esc((b.pauseType || 'pause').toLowerCase())}</em>` : ''}
          </span>
        </li>`).join('')}
    </ol>
    <p class="finprint" style="margin-top:8px">I alt cirka ${niveau.blokke.reduce((a, b) => a + (b.minutter || 0), 0)} minutter${s.type === 'interval' ? ' — de hurtige minutter skal føles som 7-8 ud af 10, ikke som sprint' : ''}.</p>
  </div>`;
}

function bodypump(s) {
  return `<div>
    <h3 class="ark-h3">Om timen</h3>
    <p style="font-size:14.5px;color:var(--text-muted)">Programmet bestemmes af instruktøren, så der er ikke lavet en falsk detaljeret plan her. Det, du selv styrer, er vægten på stangen — den kan du skrive ned nedenfor på ${s.vaegtTracks.length} hovedtracks.</p>
  </div>`;
}

function hjemmetraening(t, s, session, dato) {
  const sidste = sidsteHjemmetraening(t, dato);
  const oevelser = s.oevelser.map(id => OEVELSE_INDEX[id]);
  const afslutning = OEVELSE_INDEX[s.afslutning];

  return `<div>
    <h3 class="ark-h3">${s.runder} runder</h3>
    <p class="finprint" style="margin-bottom:12px">Kør øvelserne i rækkefølge og tag runden om igen. Skriv tallene ind undervejs — de gemmes med det samme.</p>
    ${oevelser.map(o => oevelseKort(o, session, sidste, s.runder)).join('')}

    <div class="oevelse afslutning">
      <div class="oevelse-top">
        <div class="oevelse-tegning">${oevelsesBillede(afslutning.id)}</div>
        <div>
          <h4>${esc(afslutning.navn)}</h4>
          <p class="finprint">${esc(afslutning.maal)} · ${esc(afslutning.formaal)}</p>
        </div>
        <span class="badge">Efter de ${s.runder} runder</span>
      </div>
      <p class="finprint" style="margin-top:8px">${esc(afslutning.beskrivelse)}</p>
      <label class="saet-raekke" style="margin-top:10px">
        <span class="saet-nr">Gennemført</span>
        <span class="felt-lille"><input type="number" inputmode="numeric" min="0" max="600"
          data-saet="${afslutning.id}:1:sekunder" value="${vaerdi(session, afslutning.id, 1, 'sekunder')}"
          aria-label="Sekunder Sally Up"><span class="enhed">sek</span></span>
      </label>
    </div>
  </div>`;
}

function oevelseKort(o, session, sidste, runder) {
  const felter = o.registrer;
  return `<div class="oevelse">
    <div class="oevelse-top">
      <div class="oevelse-tegning">${oevelsesBillede(o.id)}</div>
      <div>
        <h4>${esc(o.navn)}</h4>
        <p class="finprint">${esc(o.maal)} · ${esc(o.formaal)}</p>
      </div>
    </div>
    <details class="oevelse-hjaelp">
      <summary>Sådan gør du</summary>
      <p>${esc(o.beskrivelse)}</p>
    </details>
    <div class="saet-liste">
      ${Array.from({ length: o.saet }, (_, i) => i + 1).map(nr => `
        <label class="saet-raekke">
          <span class="saet-nr">Sæt ${nr}</span>
          ${felter.includes('gentagelser') ? `
            <span class="felt-lille">
              <input type="number" inputmode="numeric" min="0" max="200"
                data-saet="${o.id}:${nr}:gentagelser" value="${vaerdi(session, o.id, nr, 'gentagelser')}"
                placeholder="${sidsteVaerdi(sidste, o.id, nr, 'gentagelser')}"
                aria-label="${esc(o.navn)}, sæt ${nr}, gentagelser">
              <span class="enhed">${o.prSide ? 'pr. arm' : 'gent.'}</span>
            </span>` : ''}
          ${felter.includes('vaegt') ? `
            <span class="felt-lille">
              <input type="number" inputmode="decimal" min="0" max="200" step="0.5"
                data-saet="${o.id}:${nr}:vaegt" value="${vaerdi(session, o.id, nr, 'vaegt')}"
                placeholder="${sidsteVaerdi(sidste, o.id, nr, 'vaegt')}"
                aria-label="${esc(o.navn)}, sæt ${nr}, vægt i kilo">
              <span class="enhed">kg</span>
            </span>` : ''}
        </label>`).join('')}
    </div>
    ${sidste ? sidstTekst(sidste, o) : ''}
  </div>`;
}

const vaerdi = (session, oevelseId, nr, felt) => {
  const s = tr.saetFor(session, oevelseId, nr);
  return s && Number.isFinite(s[felt]) ? s[felt] : '';
};

const sidsteVaerdi = (sidste, oevelseId, nr, felt) => {
  const s = tr.saetFor(sidste, oevelseId, nr);
  return s && Number.isFinite(s[felt]) ? s[felt] : '';
};

function sidstTekst(sidste, o) {
  const saet = tr.saetListe(sidste).filter(x => x.oevelseId === o.id);
  if (!saet.length) return '';
  const tekst = saet
    .sort((a, b) => a.saetNr - b.saetNr)
    .map(x => [x.gentagelser, x.vaegt ? `${x.vaegt} kg` : null].filter(Boolean).join(' × '))
    .join(' · ');
  return `<p class="finprint sidst">Sidst: ${esc(tekst)}</p>`;
}

/** Seneste gennemførte hjemmetræning før denne dato — til "sidst"-tallene. */
function sidsteHjemmetraening(t, dato) {
  return (t.traening?.sessioner || [])
    .filter(s => s.dato < dato && s.status === tr.STATUS.gennemfoert && s.snapshot?.type === 'hjemme')
    .sort((a, b) => b.dato.localeCompare(a.dato))[0] || null;
}

/* ---------------- registrering ---------------- */

function registrering(s, session, dato) {
  const felter = s.registrer || [];
  const v = n => (session && session[n] != null ? session[n] : '');

  return `<div>
    <h3 class="ark-h3">Registrér</h3>
    <div class="reg-felter">
      ${felter.includes('varighed') ? `
        <label class="felt"><span>Varighed</span>
          <span class="felt-med-enhed">
            <input type="number" inputmode="numeric" min="0" max="600" data-felt="varighed"
              value="${v('varighed')}" placeholder="${s.varighed}">
            <span class="enhed">min</span>
          </span>
        </label>` : ''}

      ${felter.includes('intervaller') ? `
        <label class="felt"><span>Gennemførte intervaller</span>
          <span class="felt-med-enhed">
            <input type="number" inputmode="numeric" min="0" max="30" data-felt="intervaller"
              value="${v('intervaller')}" placeholder="—">
            <span class="enhed">stk</span>
          </span>
        </label>` : ''}
    </div>

    ${felter.includes('intensitet') ? `
      <div style="margin-top:12px">
        <p class="label" style="margin-bottom:6px">Oplevet intensitet</p>
        <div class="segment">
          ${Object.entries(INTENSITETER).map(([id, x]) => `
            <button data-intensitet="${id}" aria-pressed="${session?.intensitet === id}">${esc(x.navn)}</button>`).join('')}
        </div>
      </div>` : ''}

    ${felter.includes('vaegte') ? `
      <div style="margin-top:14px">
        <p class="label" style="margin-bottom:6px">Vægt på stangen</p>
        <p class="finprint" style="margin-bottom:8px">Kun det, du husker. Tomme felter gemmes ikke.</p>
        <div class="vaegt-gitter">
          ${s.vaegtTracks.map(t => `
            <label class="felt-lille bred">
              <span class="track">${esc(t)}</span>
              <input type="number" inputmode="decimal" min="0" max="200" step="0.5"
                data-vaegt="${esc(t)}" value="${session?.vaegte?.[t] ?? ''}"
                aria-label="Vægt på ${esc(t)} i kilo">
              <span class="enhed">kg</span>
            </label>`).join('')}
        </div>
      </div>` : ''}

    <label class="felt" style="margin-top:14px"><span>Note</span>
      <input type="text" data-felt="note" value="${esc(session?.note || '')}"
        placeholder="Fx: satte squat op til 30 kg" maxlength="240">
    </label>
  </div>`;
}

/* ---------------- binding ---------------- */

function bindArk(d) {
  const dato = aktivDato;

  $$('[data-luk]', d).forEach(b => b.addEventListener('click', () => d.close()));

  $$('[data-niveau]', d).forEach(b => b.addEventListener('click', () => {
    const s = tr.planFor(dato).skabelon;
    opdater(t => { tr.saetNiveau(t, s.id, b.dataset.niveau); }, { stille: true });
    tegnArk();
  }));

  // Sæt gemmes, mens man skriver — uden at tegne arket om, så feltet beholder fokus.
  $$('[data-saet]', d).forEach(el => el.addEventListener('input', () => {
    const [oevelseId, nr, felt] = el.dataset.saet.split(':');
    opdater(t => { tr.gemSaet(t, dato, oevelseId, Number(nr), { [felt]: el.value }); }, { stille: true });
    markerGemt(el);
  }));

  $$('[data-felt]', d).forEach(el => el.addEventListener('input', () => {
    const n = el.dataset.felt;
    const v = el.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value;
    opdater(t => { tr.gemSession(t, dato, { [n]: v }); }, { stille: true });
    markerGemt(el);
  }));

  $$('[data-vaegt]', d).forEach(el => el.addEventListener('input', () => {
    opdater(t => {
      const s = tr.sikrSession(t, dato);
      const vaegte = { ...(s.vaegte || {}) };
      if (el.value === '' || !Number.isFinite(Number(el.value))) delete vaegte[el.dataset.vaegt];
      else vaegte[el.dataset.vaegt] = Number(el.value);
      tr.gemSession(t, dato, { vaegte });
    }, { stille: true });
    markerGemt(el);
  }));

  $$('[data-intensitet]', d).forEach(b => b.addEventListener('click', () => {
    opdater(t => { tr.gemSession(t, dato, { intensitet: b.dataset.intensitet }); }, { stille: true });
    $$('[data-intensitet]', d).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  }));

  $('[data-faerdig]', d)?.addEventListener('click', () => {
    opdater(t => { tr.saetStatus(t, dato, tr.STATUS.gennemfoert); });
    toast('Gennemført');
    d.close();
  });
}

/** Diskret kvittering for at tallet er gemt — ingen konfetti. */
let gemtTimer;
function markerGemt(el) {
  el.classList.add('gemt');
  clearTimeout(gemtTimer);
  gemtTimer = setTimeout(() => {
    document.querySelectorAll('.gemt').forEach(x => x.classList.remove('gemt'));
  }, 900);
}
