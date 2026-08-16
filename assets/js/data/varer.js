/**
 * VAREKATALOG — ernæringsdata og butiksinformation.
 *
 * Adskilt fra opskrifter og UI med vilje: dette lag kan senere erstattes af et
 * API-kald (fx et rigtigt varekatalog) uden at resten af appen ændres.
 *
 * Felter
 *   navn        Varenavn som man ville lede efter det i butikken
 *   afd         Afdeling i butikken (se AFDELINGER)
 *   enh         'g' | 'ml' | 'stk' — mængdeenhed i opskrifter
 *   kcal,p,k,f  Pr. 100 g / 100 ml — eller pr. stk når enh === 'stk'
 *   fib         Fibre, samme enhed som ovenfor
 *   pakke       Typisk pakkestørrelse i butikken (bruges til "ca. 2 pk.")
 *   mrk         Markører til filtre: fisk, kylling, fjerkrae, okse, aeg,
 *               laktose, gluten, noedder
 *   fast        Fast vare i skabet — havner under "tjek skabet", ikke på listen
 *   pris        Vurderet prisklasse 1-3 (1 = billig basisvare, 3 = dyr).
 *               Dette er en grov vurdering til "billig"-mærkatet — IKKE en
 *               aktuel pris. Appen viser aldrig kronebeløb.
 *   farve       Bruges til at tegne madillustrationerne
 *
 * Næringstal er runde tal på niveau med varedeklarationer for almindelige
 * danske dagligvarer. De er gode nok til at planlægge efter, ikke til at måle med.
 */

export const AFDELINGER = [
  { id: 'groent',   navn: 'Frugt & grønt', emoji: '🥦' },
  { id: 'kod',      navn: 'Kød & fisk',    emoji: '🍗' },
  { id: 'kol',      navn: 'Køl',           emoji: '🥛' },
  { id: 'brod',     navn: 'Brød',          emoji: '🍞' },
  { id: 'frost',    navn: 'Frost',         emoji: '🧊' },
  { id: 'kolonial', navn: 'Kolonial',      emoji: '🥫' },
  { id: 'andet',    navn: 'Andet',         emoji: '🧺' }
];

export const VARER = {
  /* ---------------- Kød & fisk ---------------- */
  kyllingebryst:  { navn: 'Kyllingebryst',           afd: 'kod', enh: 'g', kcal: 106, p: 23, k: 0, f: 1.5, fib: 0, pakke: 450, mrk: ['kylling'], pris: 2, farve: '#e8c58a' },
  kyllingelaar:   { navn: 'Kyllingeoverlår u/ben',   afd: 'kod', enh: 'g', kcal: 130, p: 20, k: 0, f: 5.5, fib: 0, pakke: 800, mrk: ['kylling'], pris: 1, farve: '#d9a55f' },
  hakketokse:     { navn: 'Hakket oksekød 5-7%',     afd: 'kod', enh: 'g', kcal: 130, p: 21, k: 0, f: 5,   fib: 0, pakke: 400, mrk: ['okse'], pris: 2, farve: '#a9563f' },
  hakketkalkun:   { navn: 'Hakket kylling 4-7%', afd: 'kod', enh: 'g', kcal: 110, p: 22, k: 0, f: 3, fib: 0, pakke: 400, mrk: ['fjerkrae'], pris: 2, farve: '#e0b884', alt: 'Hakket kalkun findes sjældent i REMA — hakket kylling er samme vare her' },
  laks:           { navn: 'Laksefilet',              afd: 'kod', enh: 'g', kcal: 200, p: 20, k: 0, f: 13,  fib: 0, pakke: 400, mrk: ['fisk'], pris: 3, farve: '#ef8a67' },
  torsk:          { navn: 'Torskefilet',             afd: 'kod', enh: 'g', kcal: 82, p: 18, k: 0, f: 0.7, fib: 0, pakke: 225, mrk: ['fisk'], pris: 2, farve: '#f0e6da', alt: 'Fersk torskefilet — frossen torsk er sjælden i REMA. Rødspætte virker også' },
  rejer:          { navn: 'Kogte rejer (frost)',     afd: 'frost', enh: 'g', kcal: 85, p: 18, k: 0, f: 1,  fib: 0, pakke: 200, mrk: ['fisk'], pris: 3, farve: '#f4a58c' },
  tun:            { navn: 'Tun i vand (dåse)',       afd: 'kolonial', enh: 'g', kcal: 100, p: 23, k: 0, f: 0.5, fib: 0, pakke: 140, mrk: ['fisk'], pris: 2, farve: '#dcb894' },

  /* ---------------- Køl ---------------- */
  aeg:            { navn: 'Æg (str. M)',             afd: 'kol', enh: 'stk', kcal: 78, p: 6.5, k: 0.5, f: 5.5, fib: 0, pakke: 10, mrk: ['aeg'], pris: 1, farve: '#f7d774' },
  skyr:           { navn: 'Skyr naturel',            afd: 'kol', enh: 'g', kcal: 63, p: 11, k: 4, f: 0.2, fib: 0, pakke: 1000, mrk: ['laktose'], pris: 1, farve: '#fbf7ef' },
  gyoghurt:       { navn: 'Græsk yoghurt 2%',        afd: 'kol', enh: 'g', kcal: 73, p: 8,  k: 4, f: 2,   fib: 0, pakke: 1000, mrk: ['laktose'], pris: 2, farve: '#fbf6ea' },
  hytteost:       { navn: 'Hytteost naturel',        afd: 'kol', enh: 'g', kcal: 79, p: 12, k: 3, f: 2,   fib: 0, pakke: 450, mrk: ['laktose'], pris: 2, farve: '#fdfaf3' },
  feta:           { navn: 'Salatost i tern (16%)',   afd: 'kol', enh: 'g', kcal: 200, p: 13, k: 1, f: 16, fib: 0, pakke: 325, mrk: ['laktose'], pris: 2, farve: '#fdfdfa' },
  mozzarella:     { navn: 'Revet mozzarella',        afd: 'kol', enh: 'g', kcal: 250, p: 28, k: 2, f: 15, fib: 0, pakke: 200, mrk: ['laktose'], pris: 2, farve: '#fbf3dd' },
  parmesan:       { navn: 'Parmesan eller Grana Padano', afd: 'kol', enh: 'g', kcal: 400, p: 33, k: 0, f: 29, fib: 0, pakke: 200, mrk: ['laktose'], pris: 3, farve: '#f2e2b6', alt: 'Sælges typisk i stykke — riv selv, det smager bedre' },
  minimaelk:      { navn: 'Minimælk',                afd: 'kol', enh: 'ml', kcal: 39, p: 3.5, k: 4.8, f: 0.5, fib: 0, pakke: 1000, mrk: ['laktose'], pris: 1, farve: '#fbfbf7' },
  cremefraiche:   { navn: 'Cremefraiche 9%',         afd: 'kol', enh: 'g', kcal: 115, p: 3, k: 3.5, f: 9, fib: 0, pakke: 500, mrk: ['laktose'], pris: 1, farve: '#fcf9f0' },
  hummus:         { navn: 'Hummus',                  afd: 'kol', enh: 'g', kcal: 300, p: 7, k: 12, f: 25, fib: 5, pakke: 200, mrk: [], pris: 2, farve: '#e6d3a8' },

  /* ---------------- Frugt & grønt ---------------- */
  broccoli:       { navn: 'Broccoli',                afd: 'groent', enh: 'g', kcal: 34, p: 3, k: 4, f: 0.4, fib: 3, pakke: 400, mrk: [], pris: 1, farve: '#3f7d3a' },
  squash:         { navn: 'Squash',                  afd: 'groent', enh: 'g', kcal: 17, p: 1.2, k: 2, f: 0.3, fib: 1.1, pakke: 300, mrk: [], pris: 1, farve: '#5d8f45' },
  peberfrugt:     { navn: 'Peberfrugt',              afd: 'groent', enh: 'g', kcal: 30, p: 1, k: 5, f: 0.3, fib: 2, pakke: 150, mrk: [], pris: 2, farve: '#e2452f' },
  log:            { navn: 'Løg',                     afd: 'groent', enh: 'g', kcal: 40, p: 1, k: 7, f: 0.1, fib: 1.7, pakke: 1000, mrk: [], pris: 1, farve: '#e8dcc0' },
  rodlog:         { navn: 'Rødløg',                  afd: 'groent', enh: 'g', kcal: 42, p: 1, k: 7, f: 0.1, fib: 1.7, pakke: 500, mrk: [], pris: 1, farve: '#a4628f' },
  hvidlog:        { navn: 'Hvidløg',                 afd: 'groent', enh: 'stk', kcal: 4, p: 0.2, k: 1, f: 0, fib: 0.1, pakke: 12, mrk: [], pris: 1, farve: '#efe8d8' },
  gulerod:        { navn: 'Gulerødder',              afd: 'groent', enh: 'g', kcal: 41, p: 0.9, k: 8, f: 0.2, fib: 2.8, pakke: 1000, mrk: [], pris: 1, farve: '#e2802c' },
  champignon:     { navn: 'Champignon',              afd: 'groent', enh: 'g', kcal: 22, p: 3, k: 0.5, f: 0.3, fib: 1, pakke: 250, mrk: [], pris: 2, farve: '#c8ac8a' },
  spinat:         { navn: 'Frisk spinat',            afd: 'groent', enh: 'g', kcal: 23, p: 2.9, k: 1.5, f: 0.4, fib: 2.2, pakke: 70, mrk: [], pris: 2, farve: '#2f6b34', alt: 'Babyspinat sælges i små poser — frossen hakket spinat er billigere til gryderetter' },
  salatmix:       { navn: 'Salatmix',                afd: 'groent', enh: 'g', kcal: 15, p: 1.4, k: 1.5, f: 0.2, fib: 1.5, pakke: 200, mrk: [], pris: 2, farve: '#66a141' },
  cherrytomat:    { navn: 'Cherrytomater',           afd: 'groent', enh: 'g', kcal: 18, p: 0.9, k: 3, f: 0.2, fib: 1.2, pakke: 250, mrk: [], pris: 2, farve: '#d8332a' },
  agurk:          { navn: 'Agurk',                   afd: 'groent', enh: 'g', kcal: 15, p: 0.7, k: 2, f: 0.1, fib: 0.7, pakke: 350, mrk: [], pris: 1, farve: '#7cb04a' },
  avocado:        { navn: 'Avocado',                 afd: 'groent', enh: 'stk', kcal: 240, p: 3, k: 2, f: 22, fib: 10, pakke: 1, mrk: [], pris: 3, farve: '#7d9c3e' },
  citron:         { navn: 'Citron',                  afd: 'groent', enh: 'stk', kcal: 15, p: 0.5, k: 3, f: 0.2, fib: 1.5, pakke: 1, mrk: [], pris: 1, farve: '#f2cf3c' },
  lime:           { navn: 'Lime',                    afd: 'groent', enh: 'stk', kcal: 15, p: 0.5, k: 3, f: 0.2, fib: 1.5, pakke: 1, mrk: [], pris: 1, farve: '#9cbf3b' },
  banan:          { navn: 'Banan',                   afd: 'groent', enh: 'stk', kcal: 105, p: 1.3, k: 24, f: 0.3, fib: 3, pakke: 1, mrk: [], pris: 1, farve: '#f0d264' },
  aeble:          { navn: 'Æble',                    afd: 'groent', enh: 'stk', kcal: 80, p: 0.3, k: 19, f: 0.2, fib: 4, pakke: 1, mrk: [], pris: 1, farve: '#c9382f' },
  forarslog:      { navn: 'Forårsløg',               afd: 'groent', enh: 'g', kcal: 32, p: 1.8, k: 4, f: 0.2, fib: 2.6, pakke: 100, mrk: [], pris: 2, farve: '#79ab3f' },
  persille:       { navn: 'Persille (potte)',        afd: 'groent', enh: 'g', kcal: 36, p: 3, k: 3, f: 0.8, fib: 3.3, pakke: 30, mrk: [], pris: 2, farve: '#357a33' },
  ingefaer:       { navn: 'Frisk ingefær',           afd: 'groent', enh: 'g', kcal: 80, p: 1.8, k: 15, f: 0.8, fib: 2, pakke: 100, mrk: [], pris: 2, farve: '#d8b878' },
  kartofler:      { navn: 'Kartofler',               afd: 'groent', enh: 'g', kcal: 77, p: 2, k: 17, f: 0.1, fib: 2.2, pakke: 1500, mrk: [], pris: 1, farve: '#e4cf9c' },
  sodkartoffel:   { navn: 'Søde kartofler',          afd: 'groent', enh: 'g', kcal: 86, p: 1.6, k: 20, f: 0.1, fib: 3, pakke: 1000, mrk: [], pris: 2, farve: '#e08a3c', alt: 'Ikke altid i sortimentet — almindelige kartofler eller gulerødder virker' },

  /* ---------------- Frost ---------------- */
  aerter:         { navn: 'Ærter (frost)',           afd: 'frost', enh: 'g', kcal: 80, p: 5, k: 11, f: 0.4, fib: 5, pakke: 600, mrk: [], pris: 1, farve: '#4e9440' },
  edamame:        { navn: 'Edamamebønner (frost)',   afd: 'frost', enh: 'g', kcal: 120, p: 11, k: 9, f: 5, fib: 5, pakke: 300, mrk: [], pris: 2, farve: '#7fae42', alt: 'Kan byttes med frosne ærter eller bønner' },
  blomkaalsris:   { navn: 'Blomkålsris (frost)',     afd: 'frost', enh: 'g', kcal: 25, p: 2, k: 3, f: 0.3, fib: 2.5, pakke: 350, mrk: [], pris: 2, farve: '#f0eade', alt: 'Kan laves af et frisk blomkålshoved i foodprocessor' },
  blaabaer:       { navn: 'Blåbær (frost)',          afd: 'frost', enh: 'g', kcal: 45, p: 0.7, k: 9, f: 0.3, fib: 3, pakke: 250, mrk: [], pris: 2, farve: '#4a5fa8' },
  hindbaer:       { navn: 'Hindbær (frost)',         afd: 'frost', enh: 'g', kcal: 40, p: 1.2, k: 5, f: 0.4, fib: 6, pakke: 250, mrk: [], pris: 2, farve: '#c02f52' },

  /* ---------------- Brød & korn ---------------- */
  rugbrod:        { navn: 'Rugbrød',                 afd: 'brod', enh: 'g', kcal: 225, p: 7, k: 38, f: 2.5, fib: 8, pakke: 1000, mrk: ['gluten'], pris: 1, farve: '#7a5433' },
  tortilla:       { navn: 'Fuldkornstortilla',       afd: 'brod', enh: 'stk', kcal: 120, p: 4, k: 18, f: 2.5, fib: 3, pakke: 8, mrk: ['gluten'], pris: 2, farve: '#e6d1a8' },
  burgerbolle:    { navn: 'Burgerboller (gerne grove)', afd: 'brod', enh: 'stk', kcal: 200, p: 7, k: 33, f: 4, fib: 4, pakke: 4, mrk: ['gluten'], pris: 1, farve: '#d9ac6c', alt: 'Rene fuldkornsburgerboller er ikke fast vare — grove boller eller proteinboller virker' },
  knaekbrod:      { navn: 'Knækbrød (rug)',          afd: 'kolonial', enh: 'stk', kcal: 35, p: 1, k: 6, f: 0.3, fib: 1.5, pakke: 45, mrk: ['gluten'], pris: 1, farve: '#c9a06a' },
  havregryn:      { navn: 'Havregryn',               afd: 'kolonial', enh: 'g', kcal: 370, p: 13, k: 58, f: 7, fib: 10, pakke: 1000, mrk: ['gluten'], pris: 1, farve: '#e0cba2' },
  pasta:          { navn: 'Fuldkornspasta',          afd: 'kolonial', enh: 'g', kcal: 350, p: 13, k: 62, f: 2.5, fib: 8, pakke: 500, mrk: ['gluten'], pris: 1, farve: '#d9b579' },
  ris:            { navn: 'Fuldkornsris',            afd: 'kolonial', enh: 'g', kcal: 350, p: 8, k: 72, f: 2.5, fib: 4, pakke: 1000, mrk: [], pris: 1, farve: '#e8dcc4' },
  bulgur:         { navn: 'Bulgur',                  afd: 'kolonial', enh: 'g', kcal: 350, p: 12, k: 65, f: 1.5, fib: 8, pakke: 400, mrk: ['gluten'], pris: 1, farve: '#d6bd8c', alt: 'Couscous eller perlebyg virker på samme måde' },
  linser:         { navn: 'Røde linser',             afd: 'kolonial', enh: 'g', kcal: 340, p: 24, k: 50, f: 1.5, fib: 10, pakke: 400, mrk: [], pris: 1, farve: '#d9752f' },
  kikaerter:      { navn: 'Kikærter (dåse)',         afd: 'kolonial', enh: 'g', kcal: 120, p: 7, k: 14, f: 2.5, fib: 6, pakke: 240, mrk: [], pris: 1, farve: '#d8c184' },
  sortebonner:    { navn: 'Sorte bønner (dåse)',     afd: 'kolonial', enh: 'g', kcal: 110, p: 7, k: 13, f: 0.5, fib: 6, pakke: 252, mrk: [], pris: 1, farve: '#3b3243', alt: 'Kidneybønner er samme vare i denne sammenhæng' },
  majs:           { navn: 'Majs (dåse)',             afd: 'kolonial', enh: 'g', kcal: 85, p: 3, k: 15, f: 1, fib: 3, pakke: 285, mrk: [], pris: 1, farve: '#f0c33c' },
  hakkedetomater: { navn: 'Hakkede tomater',         afd: 'kolonial', enh: 'g', kcal: 32, p: 1.3, k: 5, f: 0.3, fib: 1.5, pakke: 400, mrk: [], pris: 1, farve: '#c0342b' },
  popcornkerner:  { navn: 'Popcornkerner',           afd: 'kolonial', enh: 'g', kcal: 380, p: 11, k: 70, f: 4, fib: 13, pakke: 400, mrk: [], pris: 1, farve: '#f3e6c4' },

  /* ---------------- Kolonial: fedt, smag, sødt ---------------- */
  olie:           { navn: 'Olivenolie',              afd: 'kolonial', enh: 'ml', kcal: 900, p: 0, k: 0, f: 100, fib: 0, pakke: 750, mrk: [], pris: 2, fast: true, farve: '#c9b447' },
  pesto:          { navn: 'Grøn pesto',              afd: 'kolonial', enh: 'g', kcal: 450, p: 4, k: 4, f: 45, fib: 1, pakke: 130, mrk: ['laktose', 'noedder'], pris: 2, farve: '#5e8c33' },
  soja:           { navn: 'Sojasauce',               afd: 'kolonial', enh: 'ml', kcal: 60, p: 6, k: 5, f: 0, fib: 0, pakke: 250, mrk: ['gluten'], pris: 2, fast: true, farve: '#4a2f1e' },
  sriracha:       { navn: 'Sriracha eller chilisauce', afd: 'kolonial', enh: 'g', kcal: 100, p: 1, k: 20, f: 0.5, fib: 0, pakke: 180, mrk: [], pris: 2, fast: true, farve: '#c9301f', alt: 'Sriracha findes ikke altid — stærk chilisauce eller sambal oelek gør det samme' },
  sweetchili:     { navn: 'Sweet chilisauce',        afd: 'kolonial', enh: 'g', kcal: 250, p: 0.5, k: 60, f: 0.2, fib: 0, pakke: 700, mrk: [], pris: 2, fast: true, farve: '#d4472e' },
  sennep:         { navn: 'Dijonsennep',             afd: 'kolonial', enh: 'g', kcal: 80, p: 5, k: 4, f: 4, fib: 1, pakke: 370, mrk: [], pris: 1, fast: true, farve: '#d8b23c' },
  honning:        { navn: 'Honning',                 afd: 'kolonial', enh: 'g', kcal: 300, p: 0, k: 80, f: 0, fib: 0, pakke: 425, mrk: [], pris: 2, fast: true, farve: '#dda52c' },
  tomatpure:      { navn: 'Tomatpuré',               afd: 'kolonial', enh: 'g', kcal: 80, p: 4, k: 12, f: 0.5, fib: 3, pakke: 200, mrk: [], pris: 1, fast: true, farve: '#a72a20' },
  kokosmaelk:     { navn: 'Kokosmælk light',         afd: 'kolonial', enh: 'ml', kcal: 90, p: 1, k: 2, f: 8.5, fib: 0, pakke: 400, mrk: [], pris: 1, farve: '#f7f3ea' },
  karrypasta:     { navn: 'Rød karrypasta',          afd: 'kolonial', enh: 'g', kcal: 120, p: 2, k: 12, f: 6, fib: 2, pakke: 110, mrk: [], pris: 2, fast: true, farve: '#b23a26' },
  proteinpulver:  { navn: 'Proteinpulver (vanilje)', afd: 'andet', enh: 'g', kcal: 380, p: 78, k: 6, f: 5, fib: 1, pakke: 750, mrk: ['laktose'], pris: 3, farve: '#efe3cf', alt: 'Ikke en REMA-vare — købes online eller i sportsbutik. Skyr eller en proteindrik kan erstatte den' },
  peanutbutter:   { navn: 'Peanutbutter',            afd: 'kolonial', enh: 'g', kcal: 600, p: 25, k: 12, f: 50, fib: 6, pakke: 340, mrk: ['noedder'], pris: 2, farve: '#c98a41' },
  mandler:        { navn: 'Mandler',                 afd: 'kolonial', enh: 'g', kcal: 600, p: 21, k: 5, f: 52, fib: 12, pakke: 100, mrk: ['noedder'], pris: 3, farve: '#c9a077' },
  graeskarkerner: { navn: 'Græskarkerner',           afd: 'kolonial', enh: 'g', kcal: 570, p: 30, k: 5, f: 49, fib: 6, pakke: 150, mrk: [], pris: 2, farve: '#6d8f3e' },
  chiafro:        { navn: 'Chiafrø',                 afd: 'kolonial', enh: 'g', kcal: 490, p: 17, k: 5, f: 31, fib: 34, pakke: 300, mrk: [], pris: 3, farve: '#4a4038', alt: 'Kan udelades — eller byttes med hørfrø' },
  sesam:          { navn: 'Sesamfrø',                afd: 'kolonial', enh: 'g', kcal: 570, p: 18, k: 5, f: 50, fib: 12, pakke: 150, mrk: [], pris: 2, fast: true, farve: '#e6d9b8' },
  chokolade:      { navn: 'Mørk chokolade 70%',      afd: 'kolonial', enh: 'g', kcal: 550, p: 8, k: 30, f: 42, fib: 10, pakke: 100, mrk: ['laktose'], pris: 2, farve: '#4a2c1d' },
  krydderi:       { navn: 'Krydderier (paprika, spidskommen, oregano, chili)', afd: 'kolonial', enh: 'g', kcal: 300, p: 10, k: 40, f: 8, fib: 25, pakke: 40, mrk: [], pris: 2, fast: true, farve: '#b5502a' },
  bouillon:       { navn: 'Grøntsagsbouillon',       afd: 'kolonial', enh: 'g', kcal: 200, p: 5, k: 30, f: 5, fib: 0, pakke: 60, mrk: [], pris: 2, fast: true, farve: '#b98a45' },
  kreatin:        { navn: 'Kreatin monohydrat',      afd: 'andet', enh: 'g', kcal: 0, p: 0, k: 0, f: 0, fib: 0, pakke: 500, mrk: [], pris: 3, farve: '#f4f4f0', fast: true, alt: 'Føres ikke i REMA — købes på apotek, i Matas eller online' }
};

/** Varer, planen bevidst vægter højere, fordi de bare bliver spist. */
export const FAVORIT_VARER = ['kyllingebryst', 'kyllingelaar', 'laks', 'tun', 'rejer', 'salatmix', 'spinat', 'cherrytomat', 'avocado'];

/** Filtre brugeren kan slå til under "undgå". */
export const MARKORER = [
  { id: 'fisk', navn: 'Fisk og skaldyr' },
  { id: 'okse', navn: 'Oksekød' },
  { id: 'kylling', navn: 'Kylling' },
  { id: 'gluten', navn: 'Gluten' },
  { id: 'laktose', navn: 'Mælkeprodukter' },
  { id: 'noedder', navn: 'Nødder' },
  { id: 'aeg', navn: 'Æg' }
];

export const vare = id => VARER[id];
