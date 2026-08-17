/**
 * Tests af træningsdelen. Køres med `node --test`.
 * Ingen afhængigheder — samme princip som resten af projektet.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { SKABELON_INDEX, UGEPLAN, OEVELSE_INDEX } from '../assets/js/data/traening.js';
import * as t from '../assets/js/core/traening.js';

/** Frisk tilstand — historikken er tom ved første installation. */
const nyTilstand = () => ({
  traening: { sessioner: [], gaature: [], niveauer: {}, accepteret: {} }
});

// En uge der ligger i fortiden, så træninger kan markeres gennemført.
const MANDAG = '2026-07-13';   // verificeret: mandag, og langt nok tilbage til flere ugers historik
const dag = n => t.laegTil(MANDAG, n);

/* ================= Ugeplanen ================= */

test('ugeplanen dækker alle syv dage præcis én gang', () => {
  assert.equal(UGEPLAN.length, 7);
  assert.deepEqual(UGEPLAN.map(d => d.ugedag), [0, 1, 2, 3, 4, 5, 6]);
  for (const d of UGEPLAN) assert.ok(SKABELON_INDEX[d.skabelonId], `mangler skabelon: ${d.skabelonId}`);
});

test('mandag er BodyPump, og tirsdag er den lettere udgave', () => {
  const man = t.planFor(dag(0));
  assert.equal(man.navn, 'Mandag');
  assert.equal(man.skabelon.id, 'bodypump-normal');
  assert.equal(man.skabelon.type, 'styrke');

  const tir = t.planFor(dag(1));
  assert.equal(tir.skabelon.id, 'bodypump-let');
  assert.match(tir.skabelon.resume, /10-20 %/);
});

test('onsdag er roligt løb med gang før og efter', () => {
  const ons = t.planFor(dag(2));
  assert.equal(ons.skabelon.type, 'lob');
  assert.equal(ons.skabelon.intensitet, 'let');
  const std = ons.skabelon.niveauer.find(n => n.standard);
  assert.deepEqual(std.blokke.map(b => b.type), ['gang', 'lob', 'gang']);
  assert.equal(ons.skabelon.varighedMin, 30);
  assert.equal(ons.skabelon.varighedMaks, 40);
  // Alternativet med løb/gang-intervaller skal findes
  assert.ok(ons.skabelon.niveauer.some(n => n.id === 'intervaller'));
});

test('torsdag er ugens tungeste BodyPump', () => {
  const tor = t.planFor(dag(3));
  assert.equal(tor.skabelon.id, 'bodypump-tung');
  assert.equal(tor.skabelon.intensitet, 'haard');
  const andre = ['bodypump-normal', 'bodypump-let'].map(id => SKABELON_INDEX[id].intensitet);
  assert.ok(andre.every(i => i !== 'haard'), 'kun torsdag må være hård BodyPump');
});

test('fredag er hjemmetræning med tre runder og Sally Up til sidst', () => {
  const fre = t.planFor(dag(4));
  assert.equal(fre.skabelon.type, 'hjemme');
  assert.equal(fre.skabelon.runder, 3);
  assert.deepEqual(fre.skabelon.oevelser, ['armboejninger', 'row', 'glutebridge', 'birddog']);
  assert.equal(fre.skabelon.afslutning, 'sallyup', 'Sally Up skal ligge efter de tre runder');
  assert.ok(fre.skabelon.varighedMin >= 15 && fre.skabelon.varighedMaks <= 20);
});

test('lørdagens intervaller følger den aftalte progression', () => {
  const lor = t.planFor(dag(5));
  assert.equal(lor.skabelon.type, 'interval');
  const [n1, n2, n3] = lor.skabelon.niveauer;
  assert.equal(n1.blokke[1].gentagelser, 6);
  assert.equal(n1.blokke[1].arbejde, 1);
  assert.equal(n1.blokke[1].pause, 2);
  assert.equal(n2.blokke[1].gentagelser, 5);
  assert.equal(n2.blokke[1].arbejde, 2);
  assert.equal(n3.blokke[1].gentagelser, 4);
  assert.equal(n3.blokke[1].arbejde, 4);
  assert.ok(n1.standard, 'niveau 1 er udgangspunktet');
});

test('søndag er restitution uden planlagt hård træning', () => {
  const son = t.planFor(dag(6));
  assert.equal(son.skabelon.type, 'restitution');
  assert.equal(son.skabelon.intensitet, 'let');
  assert.equal(son.gaatur, 60);
});

test('gåture ligger på de dage, planen siger', () => {
  const medGaatur = [0, 1, 3, 4, 6].map(i => t.planFor(dag(i)));
  assert.ok(medGaatur.every(p => p.gaatur === 60));
  assert.ok(t.planFor(dag(2)).gaaturValgfri);
  assert.ok(t.planFor(dag(5)).gaaturValgfri);
});

/* ================= Registrering ================= */

test('historikken er tom ved første installation', () => {
  const st = nyTilstand();
  assert.equal(t.historik(st).length, 0);
  assert.equal(t.noegletal(st).length, 0);
  assert.equal(t.progressionsForslag(st).length, 0);
});

test('en træning kan markeres gennemført uden at der opfindes en varighed', () => {
  const st = nyTilstand();
  t.saetStatus(st, dag(0), t.STATUS.gennemfoert);
  const s = t.sessionFor(st, dag(0));
  assert.equal(s.status, 'gennemfoert');
  assert.equal(s.varighed, null, 'planens 60 min er ikke registrerede data');
  assert.ok(s.sluttet, 'sluttidspunkt skal sættes');
  assert.equal(t.historik(st).length, 1);
  assert.equal(t.ugensBalance(st, MANDAG).traeningsminutter, 0, 'ikke-registreret tid tælles ikke');
});

test('en fremtidig dag kan ikke markeres gennemført', () => {
  const st = nyTilstand();
  const imorgen = t.laegTil(t.idag(), 1);
  assert.equal(t.saetStatus(st, imorgen, t.STATUS.gennemfoert), null);
  assert.equal(t.sessionFor(st, imorgen), null);
});

test('en sprunget træning gemmes uden at blive talt som gennemført', () => {
  const st = nyTilstand();
  t.saetStatus(st, dag(1), t.STATUS.sprunget);
  assert.equal(t.ugensBalance(st, MANDAG).gennemfoert, 0);
  assert.equal(t.ugensBalance(st, MANDAG).sprunget, 1);
});

test('øvelsessæt gemmes, opdateres og kan fjernes igen', () => {
  const st = nyTilstand();
  t.gemSaet(st, dag(4), 'armboejninger', 1, { gentagelser: 12 });
  t.gemSaet(st, dag(4), 'armboejninger', 2, { gentagelser: 10 });
  let s = t.sessionFor(st, dag(4));
  assert.equal(t.saetListe(s).length, 2);
  assert.equal(t.saetFor(s, 'armboejninger', 1).gentagelser, 12);

  t.gemSaet(st, dag(4), 'armboejninger', 1, { gentagelser: 14 });
  assert.equal(t.saetFor(t.sessionFor(st, dag(4)), 'armboejninger', 1).gentagelser, 14);
  assert.equal(t.saetListe(t.sessionFor(st, dag(4))).length, 2, 'et opdateret sæt må ikke blive til to');

  t.gemSaet(st, dag(4), 'armboejninger', 2, { gentagelser: '' });
  assert.equal(t.saetListe(t.sessionFor(st, dag(4))).length, 1, 'et tømt felt gemmes ikke som nul');
  assert.ok(t.sessionFor(st, dag(4)).saet.some(x => x.oevelseId === 'armboejninger' && x.saetNr === 2 && x.slettet),
    'det fjernede sæt efterlader en gravsten, så sletningen kan synkroniseres');
});

test('row registrerer både vægt og gentagelser', () => {
  const st = nyTilstand();
  t.gemSaet(st, dag(4), 'row', 1, { gentagelser: 12, vaegt: 12.5 });
  const saet = t.saetFor(t.sessionFor(st, dag(4)), 'row', 1);
  assert.equal(saet.gentagelser, 12);
  assert.equal(saet.vaegt, 12.5);
});

test('ukendte øvelser og felter afvises', () => {
  const st = nyTilstand();
  assert.equal(t.gemSaet(st, dag(4), 'findes-ikke', 1, { gentagelser: 10 }), null);
  t.gemSession(st, dag(0), { kalorier: 500, note: 'god time' });
  const s = t.sessionFor(st, dag(0));
  assert.equal(s.kalorier, undefined, 'kalorier må ikke kunne gemmes');
  assert.equal(s.note, 'god time');
});

test('sæt kan kun registreres på øvelser, der indgår i dagens træning', () => {
  const st = nyTilstand();
  assert.equal(t.gemSaet(st, dag(0), 'armboejninger', 1, { gentagelser: 15 }), null,
    'armbøjninger hører ikke til mandagens BodyPump');
  assert.equal(t.sessionFor(st, dag(0)), null);
});

test('sætnummer og felter valideres', () => {
  const st = nyTilstand();
  assert.equal(t.gemSaet(st, dag(4), 'armboejninger', 0, { gentagelser: 10 }), null, 'sæt 0 findes ikke');
  assert.equal(t.gemSaet(st, dag(4), 'armboejninger', 9, { gentagelser: 10 }), null, 'øvelsen har tre sæt');
  assert.equal(t.gemSaet(st, dag(4), 'armboejninger', 1.5, { gentagelser: 10 }), null);

  t.gemSaet(st, dag(4), 'armboejninger', 1, { gentagelser: 10, vaegt: 40 });
  const saet = t.saetFor(t.sessionFor(st, dag(4)), 'armboejninger', 1);
  assert.equal(saet.gentagelser, 10);
  assert.equal(saet.vaegt, undefined, 'armbøjninger registrerer ikke vægt');

  t.gemSaet(st, dag(4), 'armboejninger', 2, { gentagelser: -5 });
  assert.equal(t.saetFor(t.sessionFor(st, dag(4)), 'armboejninger', 2), null, 'negative gentagelser gemmes ikke');
  t.gemSaet(st, dag(4), 'armboejninger', 2, { gentagelser: 1e9 });
  assert.equal(t.saetFor(t.sessionFor(st, dag(4)), 'armboejninger', 2), null, 'urealistiske tal gemmes ikke');
  t.gemSaet(st, dag(4), 'armboejninger', 2, { gentagelser: '  ' });
  assert.equal(t.saetFor(t.sessionFor(st, dag(4)), 'armboejninger', 2), null, 'whitespace bliver ikke til nul');
});

test('sessionsfelter valideres, og vægte kan ikke bruges som bagdør', () => {
  const st = nyTilstand();
  t.gemSession(st, dag(0), {
    varighed: -99, intensitet: 'ekstrem', intervaller: 'seks',
    vaegte: { kalorier: 900, Squat: 'meget', Bryst: 42 }
  });
  const s = t.sessionFor(st, dag(0));
  assert.equal(s.varighed, null, 'negativ varighed afvises');
  assert.equal(s.intensitet, null, 'ukendt intensitet afvises');
  assert.equal(s.intervaller, null, 'tekst afvises');
  assert.deepEqual(s.vaegte, { Bryst: 42 }, 'kun kendte tracks med tal');
});

test('at registrere et sæt sætter træningen i gang', () => {
  const st = nyTilstand();
  t.gemSaet(st, dag(4), 'row', 1, { gentagelser: 12, vaegt: 10 });
  assert.equal(t.sessionFor(st, dag(4)).status, 'igang',
    'ellers ville tallene forsvinde ud af statistikken');
});

test('gåture registreres separat fra træningen', () => {
  const st = nyTilstand();
  t.gemGaatur(st, dag(0), 60);
  assert.equal(t.gaaturFor(st, dag(0)).minutter, 60);
  assert.equal(t.sessionFor(st, dag(0)), null, 'en gåtur må ikke markere træningen som gennemført');

  const b = t.ugensBalance(st, MANDAG);
  assert.equal(b.gaaMinutter, 60);
  assert.equal(b.gaaDage, 1);

  t.gemGaatur(st, dag(0), 0);
  assert.equal(t.gaaturFor(st, dag(0)), null, 'nul minutter fjerner registreringen');
});

/* ================= Historik er urørlig ================= */

test('en senere ændring af planen ændrer ikke gennemførte træninger', () => {
  const st = nyTilstand();
  t.saetStatus(st, dag(5), t.STATUS.gennemfoert);
  t.gemSession(st, dag(5), { intervaller: 6 });
  const foer = structuredClone(t.sessionFor(st, dag(5)).snapshot);

  // Planen laves om bagefter — som om brugeren skifter program
  const skabelon = SKABELON_INDEX['loerdag-interval'];
  const oprindeligtNavn = skabelon.navn;
  const oprindeligeNiveauer = skabelon.niveauer;
  skabelon.navn = 'Helt andet intervalprogram';
  skabelon.niveauer = [{ id: 'x', navn: '10 × 30 sek', standard: true, blokke: [] }];

  const efter = t.sessionFor(st, dag(5)).snapshot;
  assert.deepEqual(efter, foer, 'øjebliksbilledet må ikke ændre sig');
  assert.equal(efter.navn, 'Intervalløb');
  assert.equal(t.ugensDage(st, MANDAG)[5].vist.navn, 'Intervalløb', 'historikken viser det, der blev trænet');
  assert.equal(t.visning(st, dag(5)).navn, 'Intervalløb',
    'også detaljevisningen skal vise det, der blev trænet');

  skabelon.navn = oprindeligtNavn;
  skabelon.niveauer = oprindeligeNiveauer;
});

test('øjebliksbilledet fryses ved gennemførsel — ikke da dagen blev rørt', () => {
  const st = nyTilstand();
  t.gemSession(st, dag(5), { note: 'føltes frisk' });           // sessionen fødes her, på niveau 1
  t.saetNiveau(st, 'loerdag-interval', 'n3');                   // brugeren vælger 4 × 4
  t.gemSession(st, dag(5), { intervaller: 4 });
  t.saetStatus(st, dag(5), t.STATUS.gennemfoert);

  const snap = t.sessionFor(st, dag(5)).snapshot;
  assert.equal(snap.niveauId, 'n3', 'historikken skal vise det niveau, der blev løbet');
  assert.equal(snap.blokke.find(b => b.gentagelser).gentagelser, 4);

  // ... og reglen skal kunne udløses af det niveau, der faktisk blev kørt
  for (const uge of [1, 2]) {
    const d = t.laegTil(dag(5), -7 * uge);
    t.saetNiveau(st, 'loerdag-interval', 'n3');
    t.saetStatus(st, d, t.STATUS.gennemfoert);
    t.gemSession(st, d, { intervaller: 4 });
  }
  assert.ok(t.progressionsForslag(st).some(f => f.id === 'interval-niveau'),
    'tre gennemførte 4 × 4 skal tælle');
});

test('øvelsesdefinitionen fryses med, så gammel træning ikke omvurderes', async () => {
  const { OEVELSE_INDEX } = await import('../assets/js/data/traening.js');
  const st = nyTilstand();
  for (const nr of [1, 2, 3]) t.gemSaet(st, dag(4), 'armboejninger', nr, { gentagelser: 12 });
  t.saetStatus(st, dag(4), t.STATUS.gennemfoert);

  const oprindelig = OEVELSE_INDEX.armboejninger.maalMaks;
  OEVELSE_INDEX.armboejninger.maalMaks = 12;         // målet sænkes bagefter
  const forslag = t.progressionsForslag(st);
  assert.equal(forslag.some(f => f.id === 'armboejninger-variant'), false,
    'gammel træning må ikke omvurderes med tilbagevirkende kraft');
  OEVELSE_INDEX.armboejninger.maalMaks = oprindelig;
});

test('søndagens gåtur tælles ikke både som gåtur og som træningstid', () => {
  const st = nyTilstand();
  t.gemGaatur(st, dag(6), 60);
  t.saetStatus(st, dag(6), t.STATUS.gennemfoert);
  t.gemSession(st, dag(6), { varighed: 60 });
  const b = t.ugensBalance(st, MANDAG);
  assert.equal(b.gaaMinutter, 60);
  assert.equal(b.traeningsminutter, 0, 'gåturen ER søndagens træning');
});

/* ================= Progression ================= */

const fuldtHjemmesaet = (st, dato, reps) => {
  for (const nr of [1, 2, 3]) t.gemSaet(st, dato, 'armboejninger', nr, { gentagelser: reps });
  t.saetStatus(st, dato, t.STATUS.gennemfoert);
};

test('ingen forslag før betingelsen faktisk er opfyldt', () => {
  const st = nyTilstand();
  fuldtHjemmesaet(st, dag(4), 15);
  assert.equal(t.progressionsForslag(st).length, 0, 'én gang er ikke nok');
});

test('armbøjningsforslaget udløses af 15/15/15 to gange', () => {
  const st = nyTilstand();
  fuldtHjemmesaet(st, t.laegTil(dag(4), -7), 15);
  fuldtHjemmesaet(st, dag(4), 15);
  const forslag = t.progressionsForslag(st);
  const f = forslag.find(x => x.id === 'armboejninger-variant');
  assert.ok(f, 'forslaget skal komme');
  assert.match(f.tekst, /sværere variant/);
});

test('et sæt under maks blokerer forslaget', () => {
  const st = nyTilstand();
  fuldtHjemmesaet(st, t.laegTil(dag(4), -7), 15);
  t.gemSaet(st, dag(4), 'armboejninger', 1, { gentagelser: 15 });
  t.gemSaet(st, dag(4), 'armboejninger', 2, { gentagelser: 15 });
  t.gemSaet(st, dag(4), 'armboejninger', 3, { gentagelser: 14 });
  t.saetStatus(st, dag(4), t.STATUS.gennemfoert);
  assert.equal(t.progressionsForslag(st).find(x => x.id === 'armboejninger-variant'), undefined);
});

test('row-forslaget kræver maks gentagelser i alle tre sæt', () => {
  const st = nyTilstand();
  for (const uge of [0, 1]) {
    const d = t.laegTil(dag(4), -uge * 7);
    for (const nr of [1, 2, 3]) t.gemSaet(st, d, 'row', nr, { gentagelser: 15, vaegt: 10 });
    t.saetStatus(st, d, t.STATUS.gennemfoert);
  }
  const f = t.progressionsForslag(st).find(x => x.id === 'row-vaegt');
  assert.ok(f);
  assert.equal(f.handling, 'Øg vægten');
});

test('progression sker aldrig automatisk — kun når brugeren accepterer', () => {
  const st = nyTilstand();
  for (const uge of [0, 1, 2]) {
    const d = t.laegTil(dag(5), -uge * 7);
    t.saetStatus(st, d, t.STATUS.gennemfoert);
    t.gemSession(st, d, { intervaller: 6 });
  }
  assert.equal(t.aktivtNiveau(st, 'loerdag-interval').id, 'n1', 'niveauet må ikke flytte sig af sig selv');

  const f = t.progressionsForslag(st).find(x => x.id === 'interval-niveau');
  assert.ok(f, 'forslaget skal vises');
  assert.equal(t.aktivtNiveau(st, 'loerdag-interval').id, 'n1', 'det er stadig kun et forslag');

  t.accepterForslag(st, 'interval-niveau');
  assert.equal(t.aktivtNiveau(st, 'loerdag-interval').id, 'n2', 'først nu skifter niveauet');
  assert.equal(t.progressionsForslag(st).find(x => x.id === 'interval-niveau'), undefined,
    'forslaget skal forsvinde, når det er accepteret');
});

test('et afvist forslag kommer ikke igen med det samme', () => {
  const st = nyTilstand();
  fuldtHjemmesaet(st, t.laegTil(dag(4), -7), 15);
  fuldtHjemmesaet(st, dag(4), 15);
  assert.ok(t.progressionsForslag(st).some(f => f.id === 'armboejninger-variant'));
  t.afvisForslag(st, 'armboejninger-variant', dag(4));
  assert.equal(t.progressionsForslag(st).some(f => f.id === 'armboejninger-variant'), false);
});

test('en glemt træning, der registreres bagud, tælles stadig med', () => {
  const st = nyTilstand();
  fuldtHjemmesaet(st, dag(4), 15);
  t.afvisForslag(st, 'armboejninger-variant', dag(4));
  // Nye træninger efter afvisningen skal kunne udløse forslaget igen
  fuldtHjemmesaet(st, t.laegTil(dag(4), 7), 15);
  fuldtHjemmesaet(st, t.laegTil(dag(4), 14), 15);
  assert.ok(t.progressionsForslag(st).some(f => f.id === 'armboejninger-variant'));
});

/* ================= Nøgletal ================= */

test('nøgletal beregnes kun på faktisk registrerede data', () => {
  const st = nyTilstand();
  assert.equal(t.noegletal(st).length, 0);

  t.gemSaet(st, dag(4), 'armboejninger', 1, { gentagelser: 10 });
  t.gemSaet(st, dag(4), 'armboejninger', 2, { gentagelser: 12 });
  t.saetStatus(st, dag(4), t.STATUS.gennemfoert);

  const tal = t.noegletal(st);
  const push = tal.find(x => x.id === 'armboejninger');
  assert.equal(push.nu, 12, 'bedste sæt i træningen');
  assert.equal(tal.find(x => x.id === 'row'), undefined, 'ingen row-data, ingen row-tal');
  assert.equal(tal.find(x => x.id === 'lob'), undefined);
});

test('træninger pr. uge tælles på den rigtige uge', () => {
  const st = nyTilstand();
  t.saetStatus(st, dag(0), t.STATUS.gennemfoert);
  t.saetStatus(st, dag(3), t.STATUS.gennemfoert);
  t.saetStatus(st, t.laegTil(MANDAG, -7), t.STATUS.gennemfoert);
  const uger = t.traeningerPrUge(st);
  assert.equal(uger.length, 2);
  assert.deepEqual(uger.map(u => u.vaerdi), [1, 2]);
  assert.equal(uger[1].dato, MANDAG);
});

test('ugens balance tæller styrke, kondition og restitution hver for sig', () => {
  const st = nyTilstand();
  t.saetStatus(st, dag(0), t.STATUS.gennemfoert);   // BodyPump
  t.saetStatus(st, dag(2), t.STATUS.gennemfoert);   // roligt løb
  t.saetStatus(st, dag(4), t.STATUS.gennemfoert);   // hjemmetræning
  t.saetStatus(st, dag(6), t.STATUS.gennemfoert);   // restitution
  const b = t.ugensBalance(st, MANDAG);
  assert.equal(b.styrke, 2, 'BodyPump og hjemmetræning tæller begge som styrke');
  assert.equal(b.kondition, 1);
  assert.equal(b.restitution, 1);
  assert.equal(b.gennemfoert, 4);
  assert.equal(b.styrkePlanlagt, 4, 'planen har fire styrkedage om ugen');
});

/* ================= Datohåndtering ================= */

test('ugen begynder mandag, uanset hvilken dag man kigger på', () => {
  assert.equal(t.mandagI('2026-08-17'), '2026-08-17');
  assert.equal(t.mandagI('2026-08-23'), '2026-08-17', 'søndag hører til ugen før');
  assert.equal(t.ugedag('2026-08-23'), 6);
  assert.deepEqual(t.ugensDatoer('2026-08-20').length, 7);
});

test('sessioner er knyttet til dato, ikke til ugedag', () => {
  const st = nyTilstand();
  t.saetStatus(st, dag(0), t.STATUS.gennemfoert);
  t.saetStatus(st, t.laegTil(MANDAG, -7), t.STATUS.sprunget);
  assert.equal(t.sessionFor(st, dag(0)).status, 'gennemfoert');
  assert.equal(t.sessionFor(st, t.laegTil(MANDAG, -7)).status, 'sprunget');
});

test('at markere en urørt dag som planlagt opretter ingenting', () => {
  const st = nyTilstand();
  assert.equal(t.saetStatus(st, dag(1), t.STATUS.planlagt), null);
  assert.equal(t.sessionFor(st, dag(1)), null,
    'en tom session med friskt stempel ville kunne overskrive en rigtig registrering fra en anden enhed');

  // En dag, der ER registreret, kan naturligvis sættes tilbage til planlagt.
  t.saetStatus(st, dag(1), t.STATUS.gennemfoert);
  t.saetStatus(st, dag(1), t.STATUS.planlagt);
  assert.equal(t.sessionFor(st, dag(1)).status, 'planlagt');
});

test('en gåtur på nul minutter efterlader en gravsten', () => {
  const st = nyTilstand();
  t.gemGaatur(st, dag(0), 45);
  assert.equal(t.gaaturFor(st, dag(0)).minutter, 45);
  t.gemGaatur(st, dag(0), 0);
  assert.equal(t.gaaturFor(st, dag(0)), null, 'gåturen er væk for brugeren');
  assert.ok(st.traening.gaature.find(g => g.dato === dag(0))?.slettet,
    'men gravstenen bliver, så sletningen når den anden enhed');
});

test('to ændringer i samme millisekund får ikke samme stempel', () => {
  const st = nyTilstand();
  t.gemGaatur(st, dag(0), 45);
  const foerste = st.traening.gaature[0].opdateret;
  t.gemGaatur(st, dag(0), 0);
  const anden = st.traening.gaature[0].opdateret;
  assert.ok(Date.parse(anden) > Date.parse(foerste),
    'ellers ser fortrydelsen lige gammel ud som registreringen, og bliver aldrig synkroniseret');

  t.saetStatus(st, dag(0), t.STATUS.gennemfoert);
  const s1 = t.sessionFor(st, dag(0)).opdateret;
  t.saetStatus(st, dag(0), t.STATUS.sprunget);
  assert.ok(Date.parse(t.sessionFor(st, dag(0)).opdateret) > Date.parse(s1));
});
