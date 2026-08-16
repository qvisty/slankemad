/**
 * OVERSIGT — ugens vigtigste tal på få sekunder.
 * Ét dominerende tal (kalorier), tre bjælker (makroer), fire nøgletal. Slut.
 */

import { hent } from '../core/state.js';
import { beregnMaal } from '../core/ernaering.js';
import { ugensTal } from '../core/plan.js';
import { byggListe } from '../core/indkob.js';
import { tal, esc, minutter } from './format.js';
import { gaaTil } from './bus.js';

const OMKREDS = 2 * Math.PI * 80;

export function ring(andel, { over = false } = {}) {
  const a = Math.max(0, Math.min(1.35, andel));
  const fyld = Math.min(1, a) * OMKREDS;
  return `<svg viewBox="0 0 188 188" aria-hidden="true">
    <circle class="spor" cx="94" cy="94" r="80" fill="none" stroke-width="13"/>
    <circle class="fyld" cx="94" cy="94" r="80" fill="none" stroke-width="13"
      stroke-dasharray="${fyld.toFixed(1)} ${OMKREDS.toFixed(1)}"/>
  </svg>`;
}

function makrobar(navn, vaerdi, maal, farve) {
  const pct = Math.min(100, (vaerdi / Math.max(1, maal)) * 100);
  return `<div class="makro">
    <div class="makro-top">
      <span class="makro-navn"><i class="makro-prik" style="background:${farve}"></i>${esc(navn)}</span>
      <span class="makro-tal">${tal(vaerdi)} / ${tal(maal)} g</span>
    </div>
    <div class="bar"><span style="width:${pct.toFixed(1)}%;background:${farve}"></span></div>
  </div>`;
}

export function html() {
  const t = hent();
  const maal = beregnMaal(t.profil);
  const u = ugensTal(t.plan);

  if (!u) {
    return `
    <div class="hero kort">
      <div class="ring">${ring(0)}<div class="ring-midte">
        <span class="ring-tal">${tal(maal.kcal)}</span>
        <span class="ring-enhed">kcal om dagen</span>
      </div></div>
      <div style="text-align:center;display:grid;gap:6px">
        <p style="font-weight:600">Det er dit mål. Nu mangler bare maden.</p>
        <p class="finprint">${tal(maal.protein)} g protein · ${tal(maal.underskud)} kcal under dit forbrug · ca. ${tal(maal.ugetab, 2)} kg om ugen</p>
      </div>
      <button class="knap bred" data-handling="lav-plan">Lav min madplan</button>
    </div>

    <section class="blok">
      <div class="blok-hoved"><h2>Sådan virker det</h2></div>
      <div class="kort" style="display:grid;gap:14px">
        ${[
          ['1', 'Du sætter dine tal', 'Vægt, træning og hvor hurtigt det skal gå. Appen regner kalorier og protein ud.'],
          ['2', 'Du får en uge med mad, du gider spise', 'Salater, kylling, laks og tun i hovedrollen. De fleste retter er klar på 15-30 minutter.'],
          ['3', 'Indkøbslisten skriver sig selv', 'Alle råvarer lagt sammen og sorteret efter afdeling i REMA 1000.']
        ].map(([n, h, p]) => `
          <div style="display:grid;grid-template-columns:28px 1fr;gap:12px;align-items:start">
            <span style="width:28px;height:28px;border-radius:50%;background:var(--accent-soft);color:var(--accent-ink);display:grid;place-items:center;font-weight:700;font-size:13px">${n}</span>
            <div><p style="font-weight:650">${h}</p><p class="finprint">${p}</p></div>
          </div>`).join('')}
      </div>
    </section>`;
  }

  const liste = byggListe(t);
  const over = u.kcal > maal.kcal * 1.05;

  return `
  <div class="hero kort">
    <div class="ring${over ? ' over' : ''}">${ring(u.kcal / maal.kcal)}
      <div class="ring-midte">
        <span class="ring-tal">${tal(u.kcal)}</span>
        <span class="ring-enhed">kcal pr. dag i snit</span>
      </div>
    </div>
    <p class="finprint" style="text-align:center;margin-top:-6px">
      Målet er ${tal(maal.kcal)} kcal · planen ligger ${u.kcal >= maal.kcal ? tal(u.kcal - maal.kcal) + ' over' : tal(maal.kcal - u.kcal) + ' under'}
    </p>
    <div class="makrobars">
      ${makrobar('Protein', u.protein, maal.protein, 'var(--protein)')}
      ${makrobar('Kulhydrat', u.kulhydrat, maal.kulhydrat, 'var(--kulhydrat)')}
      ${makrobar('Fedt', u.fedt, maal.fedt, 'var(--fedt)')}
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <span class="label">Måltider</span>
      <span class="stat-vaerdi tal">${tal(u.maaltider)}</span>
      <span class="stat-note">${u.unikke} forskellige retter over ${u.dage} ${u.dage === 1 ? 'dag' : 'dage'}</span>
    </div>
    <div class="stat">
      <span class="label">Tid i køkkenet</span>
      <span class="stat-vaerdi tal">${tal(u.tidPrDag)}<small>min/dag</small></span>
      <span class="stat-note">${minutter(Math.round(u.tid))} i alt for hele planen</span>
    </div>
    <div class="stat">
      <span class="label">Hurtige retter</span>
      <span class="stat-vaerdi tal">${u.hurtige}<small>af ${u.maaltider}</small></span>
      <span class="stat-note">${u.hurtige >= u.langsomme ? 'Hverdagen er dækket' : 'Flere retter tager over 20 min'}</span>
    </div>
    <div class="stat">
      <span class="label">Fibre</span>
      <span class="stat-vaerdi tal">${tal(u.fiber)}<small>g/dag</small></span>
      <span class="stat-note ${u.fiber >= maal.fiber ? 'god' : ''}">${u.fiber >= maal.fiber ? 'Over anbefalingen' : `Målet er ${tal(maal.fiber)} g`}</span>
    </div>
  </div>

  <section class="blok">
    <div class="blok-hoved">
      <h2>Indkøb</h2>
      <button class="link" data-handling="gaa-indkob">Se listen</button>
    </div>
    <div class="kort" style="display:grid;gap:12px">
      <div style="display:flex;align-items:baseline;gap:8px">
        <span style="font-size:26px;font-weight:700" class="tal">${liste.antal}</span>
        <span class="muted">varer fordelt på ${liste.grupper.length} afdelinger</span>
      </div>
      ${liste.genbrug.length ? `
        <div>
          <p class="label" style="margin-bottom:6px">Går igen i flere retter</p>
          <div class="maerkater">
            ${liste.genbrug.map(g => `<span class="maerke" title="Bruges i ${g.retter.length} retter">${esc(g.navn)} · ${g.retter.length}×</span>`).join('')}
          </div>
          <p class="finprint" style="margin-top:8px">Planen genbruger råvarer med vilje — så bliver posen brugt op i stedet for smidt ud.</p>
        </div>` : ''}
    </div>
  </section>

  <section class="blok">
    <div class="blok-hoved"><h2>Fedttab</h2><button class="link" data-handling="gaa-mig">Justér</button></div>
    <div class="kort" style="display:grid;gap:10px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span class="muted">Forventet tempo</span>
        <span style="font-weight:700" class="tal">${tal(maal.ugetab, 2)} kg / uge</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span class="muted">Underskud pr. dag</span>
        <span style="font-weight:700" class="tal">${tal(maal.underskud)} kcal</span>
      </div>
      ${maal.uger ? `<div style="display:flex;justify-content:space-between;align-items:baseline">
        <span class="muted">Til ${tal(t.profil.maalvaegt, 1)} kg</span>
        <span style="font-weight:700">ca. ${maal.uger} uger</span>
      </div>` : ''}
      <p class="finprint">Kreatin binder vand i musklerne, så vægten kan stå stille i starten. Taljemålet er det ærligere tal — log det under Mig.</p>
    </div>
  </section>`;
}

export function bind(rod) {
  rod.querySelector('[data-handling="gaa-indkob"]')?.addEventListener('click', () => gaaTil('indkob'));
  rod.querySelector('[data-handling="gaa-mig"]')?.addEventListener('click', () => gaaTil('mig'));
}
