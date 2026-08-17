/**
 * SYNKRONISERING — regressionstests.
 *
 * Hver test her svarer til et scenarie, hvor den tidligere udgave mistede data
 * uden at sige det. De handler alle om det samme spørgsmål: kan brugeren miste
 * noget, han selv har registreret?
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { shimBrowser, fakeSky, logInd, ANON_NOEGLE, pgStempel } from './hjaelp-sky.js';

shimBrowser();
const server = fakeSky();

const { SKY } = await import('../assets/js/data/sky-config.js');
SKY.url = 'https://test.supabase.co';
SKY.anonNoegle = ANON_NOEGLE;

const st = await import('../assets/js/core/state.js');
const tr = await import('../assets/js/core/traening.js');
const sky = await import('../assets/js/core/sky.js');

await logInd(sky);

const MANDAG = '2026-07-13';
const dag = i => tr.laegTil(MANDAG, i);
const FREDAG = dag(4);
const naa = new Date(`${dag(6)}T20:00:00`);

/** Ny enhed: tom browser, samme konto, samme server. */
function nyEnhed() {
  st.nulstil();
}

function ryd() {
  for (const t of Object.values(server.tabeller)) t.length = 0;
  server.saetFejl(null);
  nyEnhed();
}

/** En fuldt registreret fredagstræning. */
function registrerFredag() {
  st.opdater(t => {
    tr.saetStatus(t, FREDAG, tr.STATUS.gennemfoert, naa);
    tr.gemSession(t, FREDAG, { varighed: 42, note: 'Ny rekord i armbøjninger' });
    tr.gemSaet(t, FREDAG, 'armboejninger', 1, { gentagelser: 22 });
    tr.gemSaet(t, FREDAG, 'armboejninger', 2, { gentagelser: 20 });
    tr.gemSaet(t, FREDAG, 'armboejninger', 3, { gentagelser: 18 });
  });
}

/* ================================================================== */

test('en registreret træning overlever, at en anden enhed markerer dagen som planlagt', async () => {
  ryd();
  registrerFredag();
  await sky.synkroniser();
  assert.equal(server.saet(FREDAG).length, 3);

  // Frisk telefon. Brugeren åbner ugen og trykker "Planlagt" på fredagen,
  // før der overhovedet er synkroniseret.
  nyEnhed();
  st.opdater(t => { tr.saetStatus(t, FREDAG, tr.STATUS.planlagt, naa); });
  await sky.synkroniser();

  assert.equal(server.saet(FREDAG).length, 3, 'sættene må ikke være rørt');
  const s = tr.sessionFor(st.hent(), FREDAG);
  assert.equal(s.status, 'gennemfoert');
  assert.equal(s.varighed, 42);
  assert.equal(tr.saetListe(s).length, 3);
});

test('nyeste ÆNDRING vinder — ikke nyeste synkronisering', async () => {
  ryd();
  const gammel = '2026-08-01T07:00:00.000Z';
  const ny = '2026-08-02T07:00:00.000Z';

  // Enhed B målte 88,0 om morgenen og synkroniserer først.
  st.opdater(t => { t.log = [{ dato: '2026-08-01', vaegt: 88, talje: null, opdateret: gammel }]; });
  await sky.synkroniser();

  // Enhed A rettede til 86,5 senere, men kommer online bagefter.
  nyEnhed();
  st.opdater(t => { t.log = [{ dato: '2026-08-01', vaegt: 86.5, talje: null, opdateret: ny }]; });
  await sky.synkroniser();

  assert.equal(st.hent().log[0].vaegt, 86.5, 'den seneste rettelse skal overleve');
  assert.equal(server.tabeller.maaling[0].vaegt, 86.5);
});

test('en afbrudt forbindelse midt i en synkronisering koster ingen sæt', async () => {
  ryd();
  registrerFredag();
  await sky.synkroniser();

  nyEnhed();
  await sky.synkroniser();
  st.opdater(t => { tr.gemSaet(t, FREDAG, 'armboejninger', 1, { gentagelser: 23 }); });

  server.saetFejl((m, tabel) => (m === 'POST' && tabel === 'traening_saet')
    ? new TypeError('fetch failed') : null);
  await assert.rejects(() => sky.synkroniser());
  assert.equal(server.saet(FREDAG).length, 3, 'de sæt, der lå der i forvejen, er urørte');
  assert.equal(tr.saetListe(tr.sessionFor(st.hent(), FREDAG)).length, 3, 'og de lokale er der også');

  server.saetFejl(null);
  await sky.synkroniser();
  assert.equal(server.saet(FREDAG).length, 3);
  assert.equal(tr.saetFor(tr.sessionFor(st.hent(), FREDAG), 'armboejninger', 1).gentagelser, 23,
    'rettelsen kom op ved næste forsøg');
});

test('en slettet måling bliver ikke hentet tilbage fra serveren', async () => {
  ryd();
  st.opdater(t => {
    t.log = [{ dato: '2026-08-05', vaegt: 300, talje: null, opdateret: '2026-08-05T07:00:00.000Z' }];
  });
  await sky.synkroniser();

  // Fejlmålingen slettes — som gravsten, sådan som mig.js gør det.
  st.opdater(t => {
    const nu = new Date().toISOString();
    t.log = [{ dato: '2026-08-05', vaegt: null, talje: null, slettet: nu, opdateret: nu }];
  });
  await sky.synkroniser();
  assert.equal(st.hent().log.filter(l => !l.slettet).length, 0, 'den må ikke genopstå her');

  // Og heller ikke på den anden enhed.
  nyEnhed();
  await sky.synkroniser();
  assert.equal(st.hent().log.filter(l => !l.slettet).length, 0, 'og heller ikke på den anden enhed');
});

test('en fjernet gåtur forbliver fjernet', async () => {
  ryd();
  st.opdater(t => { tr.gemGaatur(t, dag(1), 45); });
  await sky.synkroniser();
  st.opdater(t => { tr.gemGaatur(t, dag(1), 0); });
  await sky.synkroniser();

  nyEnhed();
  await sky.synkroniser();
  assert.equal(tr.gaaturFor(st.hent(), dag(1)), null);
});

test('det, brugeren registrerer MENS synkroniseringen kører, går ikke tabt', async () => {
  ryd();
  registrerFredag();
  await sky.synkroniser();
  nyEnhed();

  const igang = sky.synkroniser();
  // Brugeren registrerer torsdagens træning, mens kaldene er undervejs.
  st.opdater(t => {
    tr.saetStatus(t, dag(3), tr.STATUS.gennemfoert, naa);
    tr.gemSession(t, dag(3), { varighed: 55, note: 'Tung dag, gik godt' });
  });
  await igang;

  const torsdag = tr.sessionFor(st.hent(), dag(3));
  assert.ok(torsdag, 'torsdagen findes stadig');
  assert.equal(torsdag.varighed, 55);
  assert.equal(torsdag.note, 'Tung dag, gik godt');
  // Og fredagen kom med ned fra serveren i samme omgang.
  assert.equal(tr.sessionFor(st.hent(), FREDAG).varighed, 42);
});

test('to enheder, der retter hver sin indstilling, mister ingen af dem', async () => {
  ryd();
  // Enhed B laver en madplan og synkroniserer.
  st.opdater(t => { t.plan = { lavet: 'i går', dage: [{ navn: 'Mandag' }] }; });
  await sky.synkroniser();
  const bDele = structuredClone(st.hent().sky.dele);
  const bPlan = structuredClone(st.hent().plan);

  // Enhed A henter planen ned og retter derefter målvægten.
  nyEnhed();
  await sky.synkroniser();
  assert.deepEqual(st.hent().plan, bPlan, 'A får Bs madplan');
  st.opdater(t => { t.profil.maalvaegt = 78; });
  await sky.synkroniser();

  // B synkroniserer igen. Madplanen er stadig Bs, og målvægten er As.
  nyEnhed();
  st.opdater(t => {
    t.plan = structuredClone(bPlan);
    t.sky = { ...t.sky, dele: bDele };
  });
  const r = await sky.synkroniser();
  assert.deepEqual(st.hent().plan, bPlan, 'Bs madplan er ikke slettet');
  assert.equal(st.hent().profil.maalvaegt, 78, 'og As målvægt kom med');
  assert.deepEqual(r.konflikt, [], 'ingen af delene var i konflikt');
});

test('poster uden tidsstempel bliver sendt op — ikke overskrevet', async () => {
  ryd();
  // Data gemt før synkroniseringen fandtes har intet `opdateret`.
  st.opdater(t => { t.log = [{ dato: '2026-08-03', vaegt: 91.2, talje: 96 }]; });
  await sky.synkroniser();

  assert.equal(server.tabeller.maaling.length, 1, 'målingen skal have været sendt op');
  assert.equal(Number(server.tabeller.maaling[0].vaegt), 91.2);
  assert.ok(st.hent().log[0].opdateret, 'og have fået et stempel lokalt');
});

test('tidsstempler sammenlignes som tid, ikke som tekst', async () => {
  ryd();
  // Serveren svarer i en anden tidszone end klientens "Z".
  server.tabeller.maaling.push({
    id: 'x', bruger: '00000000-0000-4000-8000-000000000001',
    dato: '2026-08-04', vaegt: 90, talje: null,
    opdateret: '2026-08-04T12:00:00+02:00'          // = 10:00 UTC
  });
  st.opdater(t => {
    t.log = [{ dato: '2026-08-04', vaegt: 89, talje: null, opdateret: '2026-08-04T11:00:00.000Z' }];
  });
  await sky.synkroniser();
  assert.equal(st.hent().log[0].vaegt, 89, 'kl. 11 UTC er senere end kl. 10 UTC');
});

test('nulstil sletter også i skyen, så intet kommer tilbage', async () => {
  ryd();
  registrerFredag();
  st.opdater(t => { tr.gemGaatur(t, dag(0), 60); });
  await sky.synkroniser();

  await sky.sletAltISkyen();
  st.nulstil();
  await sky.synkroniser();

  assert.equal(tr.sessioner(st.hent()).length, 0);
  assert.equal(tr.gaature(st.hent()).length, 0);

  nyEnhed();
  await sky.synkroniser();
  assert.equal(tr.sessioner(st.hent()).length, 0, 'og heller ikke på den anden enhed');
});

test('to enheder kan registrere hver sit sæt på samme dag', async () => {
  ryd();
  st.opdater(t => {
    tr.saetStatus(t, FREDAG, tr.STATUS.igang, naa);
    tr.gemSaet(t, FREDAG, 'armboejninger', 1, { gentagelser: 20 });
  });
  await sky.synkroniser();

  nyEnhed();
  await sky.synkroniser();
  st.opdater(t => { tr.gemSaet(t, FREDAG, 'armboejninger', 2, { gentagelser: 18 }); });
  await sky.synkroniser();

  const saet = tr.saetListe(tr.sessionFor(st.hent(), FREDAG));
  assert.equal(saet.length, 2);
  assert.deepEqual(saet.map(x => x.gentagelser), [20, 18]);
});

test('et login, enheden ikke selv bad om, synkroniserer ikke af sig selv', async () => {
  ryd();
  globalThis.location.search = '';
  globalThis.location.hash = '#access_token=fremmed&refresh_token=r&expires_at=' + (Math.floor(Date.now() / 1000) + 7200);
  sky.fangLoginFraUrl();
  globalThis.location.hash = '';

  assert.equal(sky.erLoggetInd(), true);
  assert.equal(sky.erBekraeftet(), false);
  await assert.rejects(() => sky.synkroniser(), /Bekræft kontoen/);

  sky.bekraeftKonto();
  assert.equal(sky.erBekraeftet(), true);
  await sky.synkroniser();
});

test('flet: en gravsten vinder over en ældre rigtig post', () => {
  const r = sky.flet(
    [{ dato: '2026-08-01', vaegt: null, slettet: '2026-08-02T10:00:00.000Z', opdateret: '2026-08-02T10:00:00.000Z' }],
    [{ dato: '2026-08-01', vaegt: 90, opdateret: pgStempel('2026-08-01T10:00:00.000Z') }],
    x => x.dato,
    r2 => ({ dato: r2.dato, vaegt: r2.vaegt, opdateret: r2.opdateret })
  );
  assert.equal(r.resultat.length, 1);
  assert.ok(r.resultat[0].slettet);
  assert.equal(r.send.length, 1, 'gravstenen skal sendes op');
});

test('flet: nøglen bruges på begge sider', () => {
  const r = sky.flet(
    [{ id: 'a', opdateret: '2026-08-02T10:00:00.000Z' }],
    [{ id: 'a', opdateret: pgStempel('2026-08-01T10:00:00.000Z') }],
    x => x.id,
    x => ({ id: x.id, opdateret: x.opdateret })
  );
  assert.equal(r.resultat.length, 1, 'samme nøgle må ikke blive til to poster');
});
