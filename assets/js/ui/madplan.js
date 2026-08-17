/**
 * MADPLAN — ugen, én dag ad gangen.
 */

import { hent, opdater, erFavorit, gemPlan } from '../core/state.js';
import { makro, OPSKRIFT_INDEX, beregnMaal } from '../core/ernaering.js';
import { dagensTal, regenererDag, bytRet, skiftFleks, lavPlan, slotFaktor, valgFingeraftryk } from '../core/plan.js';
import { madSvg } from './billede.js';
import { visOpskrift, kategoriNavn } from './opskriftsark.js';
import { tal, esc, minutter, toast } from './format.js';
import { tiderFor, formiddagsvurdering, varighed } from '../core/rytme.js';
import { tegn, gaaTil } from './bus.js';

let valgtDag = 0;

export const saetDag = i => { valgtDag = i; };

export function html() {
  const t = hent();
  const plan = t.plan;
  if (!plan?.dage?.length) {
    return `<div class="tom">
      <span class="emoji">🥗</span>
      <h3>Ingen madplan endnu</h3>
      <p>Tryk her, så bygger appen en uge, der rammer dine kalorier og dit protein — med mad, du faktisk gider lave.</p>
      <button class="knap" data-handling="lav-plan">Lav min madplan</button>
    </div>`;
  }

  if (valgtDag >= plan.dage.length) valgtDag = 0;
  const maal = beregnMaal(t.profil);
  const dag = plan.dage[valgtDag];
  const d = dagensTal(dag);
  const proteinPct = Math.min(100, (d.p / Math.max(1, maal.protein)) * 100);

  const forael = plan.valgSum && plan.valgSum !== valgFingeraftryk(t.valg);

  return `
  ${forael ? `<div class="advarsel" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span>Planen her er lavet efter andre indstillinger, end du har nu. Lav en ny, hvis den skal følge dine valg.</span>
      <button class="knap lille" data-handling="ny-uge">Lav en ny plan</button>
    </div>` : ''}

  <div class="dagsstribe" role="tablist" aria-label="Vælg dag">
    ${plan.dage.map((x, i) => {
      const tt = dagensTal(x);
      return `<button class="dagsknap" role="tab" data-dag="${i}" aria-selected="${i === valgtDag}">
        <span class="d-navn">${x.navn.slice(0, 3)}</span>
        <span class="d-kcal tal">${tal(tt.kcal)}</span>
        ${x.traener ? '<span class="d-prik" title="Bodypump-dag"></span>' : '<span style="height:4px"></span>'}
      </button>`;
    }).join('')}
  </div>
  <p class="finprint" style="margin:-8px 0 0">Prikken markerer dine Bodypump-dage.</p>
  ${dag.mangler?.length ? `<p class="advarsel">Ingen retter tilbage til ${dag.mangler.join(' og ')} med dine fravalg — måltidet er sprunget over.</p>` : ''}

  <div class="kort" style="display:grid;gap:12px">
    <div class="dag-hoved">
      <div>
        <h2 style="font-size:20px;font-weight:700">${esc(dag.navn)}</h2>
        <p class="finprint">${dag.traener ? 'Bodypump-dag' : 'Hviledag'} · ${minutter(d.tid)} i køkkenet</p>
      </div>
      <div class="kcal">
        <p style="font-size:22px;font-weight:700" class="tal">${tal(d.kcal)}</p>
        <p class="finprint">mål ${tal(dag.maalKcal)} kcal</p>
      </div>
    </div>
    <div class="makro">
      <div class="makro-top">
        <span class="makro-navn"><i class="makro-prik" style="background:var(--protein)"></i>Protein</span>
        <span class="makro-tal">${tal(d.p)} / ${tal(maal.protein)} g</span>
      </div>
      <div class="bar"><span style="width:${proteinPct.toFixed(1)}%;background:var(--protein)"></span></div>
    </div>
    ${d.kcal < dag.maalKcal * 0.93 ? `<p class="finprint">Der er ${tal(dag.maalKcal - d.kcal)} kcal luft i dag. Tag en snack mere, eller større portioner.</p>` : ''}
  </div>

  <div class="maaltider">
    ${(() => {
      // Vis dagen i den rækkefølge, du spiser den — en snack kl. 15 hører til
      // før aftensmaden, ikke efter.
      const tider = tiderFor(dag.slots.map(s => s.slot), t.valg);
      return dag.slots
        .map((s, j) => ({ s, j, tid: tider[j]?.tid }))
        .sort((a, b) => (a.tid || '99').localeCompare(b.tid || '99'))
        .map(x => slotKort(x.s, valgtDag, x.j, dag, x.tid))
        .join('');
    })()}
  </div>

  ${rytmeNote(t.valg)}

  <div class="knap-gruppe" style="margin-top:4px">
    <button class="knap sek lille" data-handling="ny-dag">↻ Ny ${esc(dag.navn.toLowerCase())}</button>
    <button class="knap sek lille" data-handling="ny-uge">↻ Hele planen</button>
    <button class="knap sek lille" data-handling="gem-plan">♡ Gem planen</button>
  </div>

  ${t.gemtePlaner.length ? `
  <section class="blok">
    <div class="blok-hoved"><h2>Gemte planer</h2></div>
    <div style="display:grid;gap:8px">
      ${t.gemtePlaner.slice(0, 5).map(p => `
        <div class="kort" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px">
          <div>
            <p style="font-weight:600">${esc(p.navn)}</p>
            <p class="finprint">${p.plan.dage.length} dage · gemt ${new Date(p.dato).toLocaleDateString('da-DK')}</p>
          </div>
          <div class="knap-gruppe">
            <button class="mini" data-hent-plan="${p.id}">Hent</button>
            <button class="mini" data-slet-plan="${p.id}">Slet</button>
          </div>
        </div>`).join('')}
    </div>
  </section>` : ''}`;
}

/** Et par linjer om, hvordan dagens huller ligger — og hvad man gør ved dem. */
function rytmeNote(valg) {
  const r = formiddagsvurdering(valg);
  if (!r) return '';
  const hul = r.stoersteHul === 'eftermiddag' ? 'mellem frokost og aftensmad' : 'mellem morgenmad og frokost';
  return `<div class="kort" style="display:grid;gap:6px">
    <p class="label">Din dagsrytme</p>
    <p style="font-size:14px">Der er <strong>${varighed(r.formiddag)}</strong> fra morgenmad til frokost${r.eftermiddag ? ` og <strong>${varighed(r.eftermiddag)}</strong> fra frokost til aftensmad` : ''}.</p>
    <p class="finprint">${r.behoverFormiddagsmad
      ? `Et mellemmåltid gør reel gavn på formiddagen. Snacken er lagt omkring kl. ${r.snackTid}.`
      : `Formiddagen er kort nok til, at et mellemmåltid mest er vane, hvis morgenmaden var stor nok. Det længste hul ligger ${hul} — snacken er lagt omkring kl. ${r.snackTid}.`}</p>
  </div>`;
}

function slotKort(s, dagIndex, slotIndex, dag, tidspunkt) {
  if (s.fleks) {
    return `<div class="maaltid fleks">
      <div class="krop">
        <span class="slot">${kategoriNavn(s.slot)}${tidspunkt ? ` · kl. ${tidspunkt}` : ''} · fri aften</span>
        <h4>Spis det, I har lyst til 🍕</h4>
        <p class="finprint" style="margin-top:4px">Sigt efter omkring <strong>${tal(s.budget)} kcal</strong> og få lidt protein med. En planlagt fri aften er grunden til, at resten af ugen holder.</p>
        <div class="knap-gruppe" style="margin-top:10px">
          <button class="mini" data-fleks="${dagIndex}:${slotIndex}">Vælg en ret alligevel</button>
        </div>
      </div>
    </div>`;
  }
  const o = OPSKRIFT_INDEX[s.id];
  if (!o) return '';
  const m = makro(o);
  const f = slotFaktor(s, dag);
  return `
  <div class="maaltid-rk">
    <button class="maaltid" data-ret="${o.id}" data-faktor="${f}">
      <div class="billede">${madSvg(o, { b: 200, h: 200 })}</div>
      <div class="krop">
        <span class="slot">${tidspunkt ? `kl. ${tidspunkt} · ` : ''}${kategoriNavn(s.slot)}${o.ude ? ` · ${esc(o.sted || 'ude')}` : (s.rester ? ' · rester fra i går' : '')}</span>
        <h4>${esc(o.navn)}${erFavorit(o.id) ? ' <span class="hjerte">♥</span>' : ''}</h4>
        <p class="meta"><span class="tal">${tal(m.kcal * f)} kcal</span><span class="tal">${tal(m.p * f)} g protein</span>${o.ude ? '' : `<span>${o.tid} min</span>`}</p>
      </div>
    </button>
    <div class="kort-handling">
      <button class="rund" data-byt="${dagIndex}:${slotIndex}" title="Byt til en anden ret" aria-label="Byt ${esc(o.navn)} ud">↻</button>
      ${s.slot === 'aftensmad' ? `<button class="rund tekst-knap" data-fleks="${dagIndex}:${slotIndex}" title="Gør aftenen fri — spis ude eller bestil" aria-label="Gør aftenen fri">fri</button>` : ''}
    </div>
  </div>`;
}

export function bind(rod) {
  rod.querySelectorAll('[data-dag]').forEach(b => b.addEventListener('click', () => {
    valgtDag = Number(b.dataset.dag);
    tegn();
  }));

  rod.querySelectorAll('[data-ret]').forEach(b => b.addEventListener('click', () =>
    visOpskrift(b.dataset.ret, { faktor: Number(b.dataset.faktor) || 1 })));

  rod.querySelectorAll('[data-byt]').forEach(b => b.addEventListener('click', () => {
    const [d, s] = b.dataset.byt.split(':').map(Number);
    opdater(t => { bytRet(t, d, s); t.koeb = {}; });
    toast('Ret byttet');
  }));

  rod.querySelectorAll('[data-fleks]').forEach(b => b.addEventListener('click', () => {
    const [d, s] = b.dataset.fleks.split(':').map(Number);
    opdater(t => { skiftFleks(t, d, s); t.koeb = {}; });
  }));

  rod.querySelector('[data-handling="ny-dag"]')?.addEventListener('click', () => {
    opdater(t => { regenererDag(t, valgtDag); t.koeb = {}; });
    toast('Dagen er lavet om');
  });

  rod.querySelector('[data-handling="ny-uge"]')?.addEventListener('click', () => {
    opdater(t => { t.plan = lavPlan(t); t.koeb = {}; });
    valgtDag = 0;
    toast('Ny plan klar');
  });

  rod.querySelector('[data-handling="gem-plan"]')?.addEventListener('click', () => {
    gemPlan();
    toast('Planen er gemt');
  });

  rod.querySelectorAll('[data-hent-plan]').forEach(b => b.addEventListener('click', async () => {
    const { hentGemtPlan } = await import('../core/state.js');
    hentGemtPlan(b.dataset.hentPlan);
    valgtDag = 0;
    toast('Plan hentet frem');
  }));

  rod.querySelectorAll('[data-slet-plan]').forEach(b => b.addEventListener('click', async () => {
    const { sletGemtPlan } = await import('../core/state.js');
    sletGemtPlan(b.dataset.sletPlan);
  }));

  rod.querySelector('[data-handling="gaa-indkob"]')?.addEventListener('click', () => gaaTil('indkob'));
}
