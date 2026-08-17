/**
 * MIG — dine tal, dine indstillinger, dine målinger og den korte guide.
 */

import { hent, opdater, nulstil } from '../core/state.js';
import { beregnMaal } from '../core/ernaering.js';
import { MARKORER } from '../data/varer.js';
import { GUIDE } from '../data/guide.js';
import { linjegraf } from './graf.js';
import { tal, esc, idag, toast } from './format.js';
import { tegn } from './bus.js';

/** Grænser der holder beregningen meningsfuld — og advarer i stedet for at regne videre på vrøvl. */
const GRAENSER = {
  vaegt: [35, 250], maalvaegt: [35, 250], hojde: [120, 230], alder: [15, 100]
};

export function html() {
  const t = hent();
  const p = t.profil;
  const v = t.valg;

  return `
  <section class="blok">
    <div class="blok-hoved"><h2>Dine tal</h2></div>
    <div class="kort felter">
      <div class="felt-par">
        <label class="felt"><span>Vægt (kg)</span><input type="number" inputmode="decimal" step="0.1" min="35" max="250" name="vaegt" value="${p.vaegt}"></label>
        <label class="felt"><span>Målvægt (kg)</span><input type="number" inputmode="decimal" step="0.1" min="35" max="250" name="maalvaegt" value="${p.maalvaegt}"></label>
      </div>
      <div class="felt-par">
        <label class="felt"><span>Højde (cm)</span><input type="number" inputmode="numeric" min="120" max="230" name="hojde" value="${p.hojde}"></label>
        <label class="felt"><span>Alder</span><input type="number" inputmode="numeric" min="15" max="100" name="alder" value="${p.alder}"></label>
      </div>
      <label class="felt"><span>Køn (til stofskifteberegningen)</span>
        <select name="koen">
          <option value="mand" ${p.koen === 'mand' ? 'selected' : ''}>Mand</option>
          <option value="kvinde" ${p.koen === 'kvinde' ? 'selected' : ''}>Kvinde</option>
        </select>
      </label>
      <label class="felt"><span>Hverdagsaktivitet uden træning</span>
        <select name="aktivitet">
          <option value="1.2" ${p.aktivitet == 1.2 ? 'selected' : ''}>Stillesiddende — kontor, få skridt</option>
          <option value="1.35" ${p.aktivitet == 1.35 ? 'selected' : ''}>Let aktiv — 6-8.000 skridt</option>
          <option value="1.5" ${p.aktivitet == 1.5 ? 'selected' : ''}>Aktiv — 10.000+ skridt</option>
          <option value="1.65" ${p.aktivitet == 1.65 ? 'selected' : ''}>Meget aktiv — fysisk arbejde</option>
        </select>
      </label>
      <div class="felt-par">
        <label class="felt"><span>Bodypump pr. uge</span>
          <select name="traening">${[0, 1, 2, 3, 4, 5, 6].map(n => `<option value="${n}" ${p.traening == n ? 'selected' : ''}>${n} gange</option>`).join('')}</select>
        </label>
        <label class="felt"><span>Tempo</span>
          <select name="tempo">
            <option value="0.25" ${p.tempo == 0.25 ? 'selected' : ''}>Roligt — 0,25 kg/uge</option>
            <option value="0.5" ${p.tempo == 0.5 ? 'selected' : ''}>Moderat — 0,5 kg/uge</option>
            <option value="0.75" ${p.tempo == 0.75 ? 'selected' : ''}>Hurtigt — 0,75 kg/uge</option>
          </select>
        </label>
      </div>
    </div>
    <div id="maal-boks">${maalBoks()}</div>
  </section>

  <section class="blok">
    <div class="blok-hoved"><h2>Madplanen</h2></div>
    <div class="kort felter">
      <div class="felt-par">
        <label class="felt"><span>Antal personer</span>
          <select data-valg="personer">${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}" ${v.personer == n ? 'selected' : ''}>${n}</option>`).join('')}</select>
        </label>
        <label class="felt"><span>Dage i planen</span>
          <select data-valg="dage">${[3, 4, 5, 6, 7].map(n => `<option value="${n}" ${v.dage == n ? 'selected' : ''}>${n} dage</option>`).join('')}</select>
        </label>
      </div>
      <label class="felt"><span>Højst tid pr. ret på hverdage</span>
        <select data-valg="maxTid">
          <option value="15" ${v.maxTid == 15 ? 'selected' : ''}>15 minutter</option>
          <option value="20" ${v.maxTid == 20 ? 'selected' : ''}>20 minutter</option>
          <option value="30" ${v.maxTid == 30 ? 'selected' : ''}>30 minutter</option>
          <option value="45" ${v.maxTid == 45 ? 'selected' : ''}>Er ligegyldigt</option>
        </select>
      </label>
      <div>
        <p class="label" style="margin-bottom:8px">Måltider planen skal dække</p>
        ${[['morgenmad', 'Morgenmad'], ['frokost', 'Frokost'], ['aftensmad', 'Aftensmad']].map(([k, n]) => `
          <label class="skifter"><span>${n}</span><input type="checkbox" data-valg="${k}" ${v[k] ? 'checked' : ''}></label>`).join('')}
        <label class="felt" style="margin-top:8px"><span>Snacks pr. dag</span>
          <select data-valg="snacks">${[0, 1, 2].map(n => `<option value="${n}" ${v.snacks == n ? 'selected' : ''}>${n}</option>`).join('')}</select>
        </label>
      </div>
      <label class="skifter"><span>Genbrug aftensmad som frokost dagen efter</span><input type="checkbox" data-valg="rester" ${v.rester ? 'checked' : ''}></label>
      <label class="skifter"><span>Én fri aften om ugen</span><input type="checkbox" data-valg="fleksAften" ${v.fleksAften ? 'checked' : ''}></label>
      ${v.fleksAften ? `<label class="felt"><span>Hvilken dag skal være fri?</span>
        <select data-valg="fleksDag">${['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'].map((d, i) => `<option value="${i}" ${v.fleksDag == i ? 'selected' : ''}>${d}</option>`).join('')}</select>
      </label>` : ''}
      <label class="skifter"><span>Sæt krydderier og olie på indkøbslisten</span><input type="checkbox" data-valg="fasteVarer" ${v.fasteVarer ? 'checked' : ''}></label>
      <div>
        <p class="label" style="margin-bottom:8px">Undgå</p>
        ${MARKORER.map(m => `<label class="skifter"><span>${esc(m.navn)}</span><input type="checkbox" data-undgaa="${m.id}" ${v.undgaa.includes(m.id) ? 'checked' : ''}></label>`).join('')}
      </div>
      <button class="knap bred" data-handling="lav-plan">Lav en ny plan med disse valg</button>
    </div>
  </section>

  <section class="blok">
    <div class="blok-hoved"><h2>Fremskridt</h2></div>
    <form class="kort felter" id="log-form">
      <p class="finprint">Mål om morgenen, før morgenmad. Taljen i navlehøjde, uden at spænde. Én gang om ugen er nok.</p>
      <div class="felt-par">
        <label class="felt"><span>Vægt (kg)</span><input type="number" step="0.1" inputmode="decimal" name="log-vaegt" placeholder="${p.vaegt}"></label>
        <label class="felt"><span>Talje (cm)</span><input type="number" step="0.1" inputmode="decimal" name="log-talje" placeholder="fx 98"></label>
      </div>
      <label class="felt"><span>Dato</span><input type="date" name="dato" value="${idag()}"></label>
      <button class="knap bred" type="submit">Gem måling</button>
    </form>
    ${fremskridt()}
  </section>

  <section class="blok">
    <div class="blok-hoved"><h2>Kort og ærligt</h2></div>
    <div style="display:grid;gap:8px">
      ${GUIDE.map(g => `<details class="guide-punkt"><summary>${esc(g.titel)}</summary><p>${esc(g.tekst)}</p></details>`).join('')}
    </div>
  </section>

  <section class="blok">
    <div class="blok-hoved"><h2>Om appen</h2></div>
    <div class="kort" style="display:grid;gap:10px">
      <p class="finprint">Alt, du taster ind, bliver liggende i din egen browser. Der sendes ingen data nogen steder hen, og der er ingen konto.</p>
      <p class="finprint">Næringstal er runde tal på niveau med varedeklarationer og er gode nok til at planlægge efter — ikke til at måle med. Pakkestørrelser følger REMA 1000's typiske sortiment. Appen viser ingen priser, fordi der ikke findes en åben, kontrollerbar priskilde.</p>
      <p class="finprint">Appen er et planlægningsværktøj, ikke sundhedsfaglig rådgivning. Er du gravid, har en spiseforstyrrelse i bagagen eller en sygdom, der påvirker kost, så tal med din læge eller en klinisk diætist først.</p>
      <div class="knap-gruppe">
        <a class="knap sek lille" href="./progress.html">Udviklingsstatus</a>
        <button class="knap tekst lille" data-handling="nulstil">Nulstil alt</button>
      </div>
    </div>
  </section>`;
}

function maalBoks() {
  const t = hent();
  const m = beregnMaal(t.profil);
  return `<div class="kort" style="display:grid;gap:10px">
    <div class="stats" style="grid-template-columns:repeat(2,1fr)">
      <div class="stat" style="box-shadow:none;background:var(--surface-sunk)">
        <span class="label">Dagligt mål</span>
        <span class="stat-vaerdi tal">${tal(m.kcal)}<small>kcal</small></span>
        <span class="stat-note">${tal(m.underskud)} under dit forbrug</span>
      </div>
      <div class="stat" style="box-shadow:none;background:var(--surface-sunk)">
        <span class="label">Protein</span>
        <span class="stat-vaerdi tal">${tal(m.protein)}<small>g</small></span>
        <span class="stat-note">2,0 g pr. kg kropsvægt</span>
      </div>
      <div class="stat" style="box-shadow:none;background:var(--surface-sunk)">
        <span class="label">Træningsdag</span>
        <span class="stat-vaerdi tal">${tal(m.traeningsdag)}<small>kcal</small></span>
        <span class="stat-note">Hviledag: ${tal(m.hviledag)} kcal</span>
      </div>
      <div class="stat" style="box-shadow:none;background:var(--surface-sunk)">
        <span class="label">Tempo</span>
        <span class="stat-vaerdi tal">${tal(m.ugetab, 2)}<small>kg/uge</small></span>
        <span class="stat-note">${m.uger ? `ca. ${m.uger} uger til målet` : 'Sæt en målvægt'}</span>
      </div>
    </div>
    ${m.hurtigt ? `<p class="advarsel">Tempoet er over 0,7 % af din kropsvægt om ugen. Det går hurtigt — men risikoen for at tabe muskler stiger, og det er lige præcis det, træningen skal forhindre. Overvej et roligere tempo.</p>` : ''}
    ${m.begraenset ? `<p class="advarsel">Tempoet er automatisk skruet ned, så underskuddet holder sig under 25 % af dit forbrug.</p>` : ''}
    ${t.profil.maalvaegt >= t.profil.vaegt ? `<p class="advarsel">Din målvægt er ikke lavere end din nuværende vægt. Appen regner stadig et underskud ud, men den kan ikke sige, hvor lang tid der går.</p>` : ''}
    <p class="finprint">Beregnet med Mifflin-St Jeor plus dit aktivitetsniveau og ${t.profil.traening} Bodypump-timer. Proteinmålet regnes af ${tal(m.proteinVaegt)} kg — din målvægt, ikke din nuværende vægt, fordi fedtvæv ikke har et proteinbehov.</p>
    <p class="finprint">Tidshorisonten er en lige linje. I virkeligheden falder dit forbrug i takt med vægten, så regn med 15-25 % længere. Justér efter, hvad vægten og taljen faktisk gør over 3-4 uger.</p>
  </div>`;
}

function fremskridt() {
  const log = [...hent().log].sort((a, b) => a.dato.localeCompare(b.dato));
  if (!log.length) {
    return `<div class="kort"><p class="finprint">Ingen målinger endnu. Den første måling er dit nulpunkt — og med kreatin i blandingen er taljen det ærligste tal at følge.</p></div>`;
  }
  const foerst = log[0], sidst = log[log.length - 1];
  const dv = sidst.vaegt != null && foerst.vaegt != null ? sidst.vaegt - foerst.vaegt : null;
  const dt = sidst.talje != null && foerst.talje != null ? sidst.talje - foerst.talje : null;

  return `
  <div class="stats" style="grid-template-columns:repeat(2,1fr)">
    <div class="stat">
      <span class="label">Vægt nu</span>
      <span class="stat-vaerdi tal">${sidst.vaegt != null ? tal(sidst.vaegt, 1) : '–'}<small>kg</small></span>
      ${dv != null ? `<span class="stat-note ${dv < 0 ? 'god' : ''}">${dv < 0 ? '↓' : '↑'} ${tal(Math.abs(dv), 1)} kg siden start</span>` : ''}
    </div>
    <div class="stat">
      <span class="label">Talje nu</span>
      <span class="stat-vaerdi tal">${sidst.talje != null ? tal(sidst.talje, 1) : '–'}<small>cm</small></span>
      ${dt != null ? `<span class="stat-note ${dt < 0 ? 'god' : ''}">${dt < 0 ? '↓' : '↑'} ${tal(Math.abs(dt), 1)} cm siden start</span>` : ''}
    </div>
  </div>
  <div class="kort" style="display:grid;gap:20px">
    ${linjegraf(log.filter(l => l.vaegt != null).map(l => ({ x: l.dato, y: l.vaegt })), { titel: 'Vægt', enhed: 'kg', farve: 'var(--serie-1)' })}
    ${linjegraf(log.filter(l => l.talje != null).map(l => ({ x: l.dato, y: l.talje })), { titel: 'Taljemål', enhed: 'cm', farve: 'var(--serie-2)' })}
    <table class="log-tabel">
      <caption>Alle målinger</caption>
      <thead><tr><th scope="col">Dato</th><th scope="col">Vægt</th><th scope="col">Talje</th><th scope="col"><span class="skjult">Slet</span></th></tr></thead>
      <tbody>${log.slice().reverse().map(l => `<tr>
        <td>${esc(l.dato)}</td>
        <td>${l.vaegt != null ? tal(l.vaegt, 1) : '–'}</td>
        <td>${l.talje != null ? tal(l.talje, 1) : '–'}</td>
        <td><button class="mini" data-slet="${esc(l.dato)}" aria-label="Slet måling fra ${esc(l.dato)}">Slet</button></td>
      </tr>`).join('')}</tbody>
    </table>
  </div>`;
}

export function bind(rod) {
  // Profilfelter opdaterer målene med det samme, men uden at tegne hele siden
  // om — ellers mister feltet fokus, mens man taster.
  rod.querySelectorAll('[name]').forEach(el => {
    const navn = el.getAttribute('name');
    if (!['vaegt', 'maalvaegt', 'hojde', 'alder', 'koen', 'aktivitet', 'traening', 'tempo'].includes(navn)) return;
    el.addEventListener('input', () => {
      const vaerdi = el.type === 'number' ? Number(el.value) : (isNaN(Number(el.value)) ? el.value : Number(el.value));
      if (el.type === 'number' && (el.value === '' || !Number.isFinite(vaerdi))) return;
      const g = GRAENSER[navn];
      if (g && (vaerdi < g[0] || vaerdi > g[1])) {
        el.setAttribute('aria-invalid', 'true');
        return;                                    // gem ikke tal, der ikke kan passe
      }
      el.removeAttribute('aria-invalid');
      opdater(t => { t.profil[navn] = vaerdi; }, { stille: true });
      const boks = rod.querySelector('#maal-boks');
      if (boks) boks.innerHTML = maalBoks();
    });
  });

  rod.querySelectorAll('[data-valg]').forEach(el => {
    const navn = el.dataset.valg;
    el.addEventListener('change', () => {
      const vaerdi = el.type === 'checkbox' ? el.checked : (isNaN(Number(el.value)) ? el.value : Number(el.value));
      const kraeverGentegning = navn === 'fleksAften';
      opdater(t => { t.valg[navn] = vaerdi; }, { stille: !kraeverGentegning });
      if (kraeverGentegning) tegn();
    });
  });

  rod.querySelectorAll('[data-undgaa]').forEach(el => el.addEventListener('change', () => {
    const m = el.dataset.undgaa;
    opdater(t => {
      t.valg.undgaa = el.checked
        ? [...new Set([...t.valg.undgaa, m])]
        : t.valg.undgaa.filter(x => x !== m);
    }, { stille: true });
  }));

  rod.querySelector('#log-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const dato = f.get('dato');
    const vaegt = f.get('log-vaegt') ? Number(f.get('log-vaegt')) : null;
    const talje = f.get('log-talje') ? Number(f.get('log-talje')) : null;
    if (!dato || (vaegt == null && talje == null)) { toast('Udfyld vægt eller talje'); return; }
    opdater(t => {
      t.log = [...t.log.filter(l => l.dato !== dato), { dato, vaegt, talje }];
      if (vaegt != null) t.profil.vaegt = vaegt;
    });
    toast('Måling gemt');
  });

  rod.querySelectorAll('[data-slet]').forEach(b => b.addEventListener('click', () => {
    opdater(t => { t.log = t.log.filter(l => l.dato !== b.dataset.slet); });
  }));

  rod.querySelector('[data-handling="nulstil"]')?.addEventListener('click', () => {
    if (!confirm('Nulstil alt — dine tal, planen og alle målinger?')) return;
    nulstil();
    toast('Alt er nulstillet');
  });
}
