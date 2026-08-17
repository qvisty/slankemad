/**
 * TRÆNINGSPLAN — seed af den faktiske ugeplan.
 *
 * Datamodellen er normaliseret og holdt tæt på relationelle tabeller, så den
 * senere kan flyttes til en rigtig backend (Django/Postgres) eller fodres med
 * importerede data fra fx Garmin, uden at visningerne skal skrives om:
 *
 *   SKABELONER   → workout_template   (id, navn, type, intensitet, varighed …)
 *   ØVELSER      → exercise           (id, template_id, navn, saet, maal …)
 *   UGEPLAN      → training_day       (ugedag, template_id, gaatur_minutter)
 *   NIVEAUER     → template_level     (template_id, niveau, blokke)
 *   REGLER       → progression_rule   (id, exercise_id, betingelse, forslag)
 *
 * Alt, der registreres, ligger i core/traening.js og gemmes med et øjebliksbillede
 * af skabelonen, så en senere ændring af planen aldrig ændrer historikken.
 *
 * Der opdigtes ingen data: ingen puls, intet kondital, ingen distancer og ingen
 * kalorier. Kun det, brugeren selv kan registrere.
 */

export const TYPER = {
  styrke:      { navn: 'Styrke',            kort: 'Styrke' },
  hjemme:      { navn: 'Hjemmetræning',     kort: 'Hjemme' },
  lob:         { navn: 'Løb',               kort: 'Løb' },
  interval:    { navn: 'Intervalløb',       kort: 'Interval' },
  restitution: { navn: 'Aktiv restitution', kort: 'Restitution' }
};

export const INTENSITETER = {
  let:     { navn: 'Let',     niveau: 1 },
  moderat: { navn: 'Moderat', niveau: 2 },
  haard:   { navn: 'Hård',    niveau: 3 }
};

/* ==================================================================
   ØVELSER — kun til hjemmetræningen, hvor sæt faktisk registreres
================================================================== */
export const OEVELSER = [
  {
    id: 'armboejninger',
    navn: 'Armbøjninger',
    saet: 3,
    maal: '8-15 gentagelser',
    maalMin: 8,
    maalMaks: 15,
    registrer: ['gentagelser'],
    formaal: 'Bryst, skuldre og triceps',
    beskrivelse: 'Hænderne lidt bredere end skuldrene, kroppen i én lige linje fra hoved til hæle. Sænk dig kontrolleret, til brystet er tæt på gulvet, og pres op. Er det for hårdt, så tag dem med hænderne på et bord eller en bænk frem for at slippe teknikken.',
    regel: 'armboejninger-variant'
  },
  {
    id: 'row',
    navn: 'Håndvægt row',
    saet: 3,
    maal: '10-15 gentagelser pr. arm',
    maalMin: 10,
    maalMaks: 15,
    registrer: ['gentagelser', 'vaegt'],
    prSide: true,
    formaal: 'Ryg og biceps',
    beskrivelse: 'Støt den ene hånd og det ene knæ på en bænk eller stol, ryggen vandret og lige. Træk håndvægten op mod hoften med albuen tæt på kroppen, og sænk kontrolleret. Undgå at dreje i overkroppen.',
    regel: 'row-vaegt'
  },
  {
    id: 'glutebridge',
    navn: 'Glute bridge',
    saet: 3,
    maal: '15-20 gentagelser',
    maalMin: 15,
    maalMaks: 20,
    registrer: ['gentagelser'],
    formaal: 'Balder og baglår',
    beskrivelse: 'Lig på ryggen med bøjede knæ og fødderne i gulvet. Spænd ballerne og løft hoften, til kroppen omtrent danner en lige linje fra skuldre til knæ. Sænk kontrolleret.',
    regel: 'glutebridge-vaegt'
  },
  {
    id: 'birddog',
    navn: 'Bird dog',
    saet: 3,
    maal: '8-10 gentagelser pr. side',
    maalMin: 8,
    maalMaks: 10,
    registrer: ['gentagelser'],
    prSide: true,
    formaal: 'Stabilitet i ryg og core',
    beskrivelse: 'Stå på alle fire. Stræk højre arm frem og venstre ben tilbage, så kroppen danner en lige linje. Vend tilbage til start, og gentag med modsatte side. Fokus er kontrol, ikke fart.',
    regel: null
  },
  {
    id: 'sallyup',
    navn: 'Sally Up',
    saet: 1,
    maal: '4 minutter til musik',
    registrer: ['sekunder'],
    formaal: 'Direkte mavetræning',
    beskrivelse: 'Fire minutter mavetræning i takt til musikken. Det er programmets primære direkte mavetræning — derfor er der ikke flere mavebøjninger andre steder.',
    regel: null
  }
];

export const OEVELSE_INDEX = Object.fromEntries(OEVELSER.map(o => [o.id, o]));

/* ==================================================================
   PROGRESSIONSREGLER
   Rene regler på registrerede data. De foreslår — de ændrer aldrig noget selv.
================================================================== */
export const REGLER = [
  {
    id: 'armboejninger-variant',
    oevelseId: 'armboejninger',
    /** Betingelse: alle sæt på maks (15) i mindst to registrerede træninger. */
    betingelse: { type: 'alleSaetPaaMaks', gange: 2 },
    forslag: 'Du har kørt 15, 15 og 15 flere gange. Næste skridt er en sværere variant frem for endnu flere gentagelser — fx armbøjninger med fødderne hævet, eller langsommere nedsænkning på tre sekunder.',
    handling: 'Skift til en sværere variant'
  },
  {
    id: 'row-vaegt',
    oevelseId: 'row',
    betingelse: { type: 'alleSaetPaaMaks', gange: 2 },
    forslag: 'Du har taget 15 gentagelser pr. arm i alle tre sæt. Sæt vægten op ved næste træning — typisk 2 kg — og forvent at falde til 10-12 gentagelser igen.',
    handling: 'Øg vægten'
  },
  {
    id: 'glutebridge-vaegt',
    oevelseId: 'glutebridge',
    betingelse: { type: 'alleSaetPaaMaks', gange: 2 },
    forslag: 'Tyve gentagelser i alle tre sæt er let nu. Læg en håndvægt over hoften, så øvelsen bliver ved med at kræve noget.',
    handling: 'Læg vægt på'
  },
  {
    id: 'interval-niveau',
    skabelonId: 'loerdag-interval',
    /** Betingelse: alle intervaller gennemført på det aktuelle niveau, 3 gange. */
    betingelse: { type: 'alleIntervallerGennemfoert', gange: 3 },
    forslag: 'Du har gennemført alle intervaller som planlagt tre gange. Du kan tage næste intervalniveau, hvis du har lyst — det er dit valg, ikke automatisk.',
    handling: 'Skift til næste intervalniveau'
  }
];

/* ==================================================================
   SKABELONER — én pr. træningstype i ugeplanen
================================================================== */
export const SKABELONER = [
  {
    id: 'bodypump-normal',
    navn: 'BodyPump',
    type: 'styrke',
    intensitet: 'moderat',
    varighed: 60,
    tidspunkt: '17.00-18.00',
    formaal: ['Helkropsstyrke', 'Muskulær udholdenhed'],
    resume: 'Normal til relativt tung. Ugens første styrketime — sæt niveauet her, så tirsdag kan ligge lidt under.',
    noter: [
      'Programmet bestemmes af instruktøren. Det, du selv styrer, er vægten på stangen.',
      'Registrér vægten på de tracks, du kan huske — det er nok til at se en udvikling.'
    ],
    vaegtTracks: ['Squat', 'Bryst', 'Ryg/dødløft', 'Lunges'],
    registrer: ['varighed', 'intensitet', 'vaegte', 'note']
  },
  {
    id: 'bodypump-let',
    navn: 'BodyPump (lettere)',
    type: 'styrke',
    intensitet: 'moderat',
    varighed: 60,
    tidspunkt: '17.00-18.00',
    formaal: ['Helkropsstyrke', 'Muskulær udholdenhed', 'Lavere belastning end mandag'],
    resume: 'Dagen efter mandag. Squat, lunges og dødløftsrelaterede øvelser køres 10-20 % lettere, så benene kan holde til torsdag.',
    noter: [
      'Tag 10-20 % af stangen på squat, lunges og dødløft sammenlignet med mandag.',
      'Overkroppen må gerne ligge på samme vægt som mandag — det er benene, der skal skånes.'
    ],
    vaegtTracks: ['Squat', 'Bryst', 'Ryg/dødløft', 'Lunges'],
    registrer: ['varighed', 'intensitet', 'vaegte', 'note']
  },
  {
    id: 'bodypump-tung',
    navn: 'BodyPump (ugens tungeste)',
    type: 'styrke',
    intensitet: 'haard',
    varighed: 60,
    tidspunkt: '17.00-18.00',
    formaal: ['Helkropsstyrke', 'Muskulær udholdenhed', 'Progression i belastning'],
    resume: 'Ugens tungeste time. Det er her, vægten på stangen skal op, når en belastning har været til at styre flere gange.',
    noter: [
      'Kunne du gennemføre en vægt flere gange med god teknik, så er det i dag, den skal op.',
      'Notér hvilke tracks du satte op — så kan du se det næste uge.'
    ],
    vaegtTracks: ['Squat', 'Bryst', 'Ryg/dødløft', 'Lunges'],
    registrer: ['varighed', 'intensitet', 'vaegte', 'note']
  },
  {
    id: 'onsdag-roligt-lob',
    navn: 'Roligt løb',
    type: 'lob',
    intensitet: 'let',
    varighed: 35,
    varighedMin: 30,
    varighedMaks: 40,
    formaal: ['Aerob grundform', 'Kondition', 'Lav belastning'],
    resume: 'Så roligt, at du kan føre en samtale hele vejen. Det er hele pointen med dagen.',
    niveauer: [
      {
        id: 'sammenhaengende',
        navn: 'Sammenhængende løb',
        standard: true,
        blokke: [
          { navn: 'Rask gang', minutter: 5, type: 'gang' },
          { navn: 'Roligt løb i samtaletempo', minutter: 27, type: 'lob', spaend: '25-30 min' },
          { navn: 'Gang', minutter: 5, type: 'gang' }
        ]
      },
      {
        id: 'intervaller',
        navn: 'Løb/gang-intervaller',
        beskrivelse: 'Hvis sammenhængende løb er for hårdt lige nu.',
        blokke: [
          { navn: 'Rask gang', minutter: 5, type: 'gang' },
          { navn: '6 × (4 min løb + 1 min gang)', minutter: 30, type: 'lob', gentagelser: 6 },
          { navn: 'Gang', minutter: 5, type: 'gang' }
        ]
      }
    ],
    noter: ['Kan du ikke tale i hele sætninger undervejs, løber du for hurtigt.'],
    registrer: ['varighed', 'intensitet', 'note']
  },
  {
    id: 'fredag-hjemme',
    navn: 'Hjemmetræning',
    type: 'hjemme',
    intensitet: 'moderat',
    varighed: 18,
    varighedMin: 15,
    varighedMaks: 20,
    formaal: ['Styrke i overkrop og core', 'Stabilitet'],
    resume: 'Tre runder af fire øvelser, og fire minutter Sally Up til sidst. Femten til tyve minutter i alt.',
    runder: 3,
    oevelser: ['armboejninger', 'row', 'glutebridge', 'birddog'],
    afslutning: 'sallyup',
    noter: ['Kør øvelserne i rækkefølge og tag runden om igen. Hvil kun så længe, du har brug for.'],
    registrer: ['saet', 'varighed', 'intensitet', 'note']
  },
  {
    id: 'loerdag-interval',
    navn: 'Intervalløb',
    type: 'interval',
    intensitet: 'haard',
    varighed: 30,
    formaal: ['Kondition', 'Fart i benene'],
    resume: 'De hurtige minutter skal opleves som 7-8 ud af 10. Det er ikke sprint — du skal kunne gentage det sidste interval lige så godt som det første.',
    niveauer: [
      {
        id: 'n1',
        navn: '6 × 1 minut',
        standard: true,
        anbefaletUger: 'Uge 1-3',
        blokke: [
          { navn: 'Roligt løb', minutter: 10, type: 'lob' },
          { navn: '6 × 1 min hurtigt', minutter: 6, type: 'hurtigt', gentagelser: 6, arbejde: 1, pause: 2, pauseType: 'Meget roligt løb eller gang' },
          { navn: 'Roligt løb eller gang', minutter: 8, type: 'lob', spaend: '5-10 min' }
        ]
      },
      {
        id: 'n2',
        navn: '5 × 2 minutter',
        anbefaletUger: 'Uge 4-6',
        blokke: [
          { navn: 'Roligt løb', minutter: 10, type: 'lob' },
          { navn: '5 × 2 min hurtigt', minutter: 10, type: 'hurtigt', gentagelser: 5, arbejde: 2, pause: 2, pauseType: 'Meget roligt løb eller gang' },
          { navn: 'Roligt løb eller gang', minutter: 8, type: 'lob', spaend: '5-10 min' }
        ]
      },
      {
        id: 'n3',
        navn: '4 × 4 minutter',
        anbefaletUger: 'Senere',
        blokke: [
          { navn: 'Roligt løb', minutter: 10, type: 'lob' },
          { navn: '4 × 4 min hurtigt', minutter: 16, type: 'hurtigt', gentagelser: 4, arbejde: 4, pause: 3, pauseType: 'Meget roligt løb eller gang' },
          { navn: 'Roligt løb eller gang', minutter: 8, type: 'lob', spaend: '5-10 min' }
        ]
      }
    ],
    noter: ['Niveauet skifter ikke af sig selv. Appen foreslår — du bestemmer.'],
    registrer: ['intervaller', 'varighed', 'intensitet', 'note']
  },
  {
    id: 'sondag-restitution',
    navn: 'Aktiv restitution',
    type: 'restitution',
    intensitet: 'let',
    varighed: 60,
    formaal: ['Restitution', 'Bevægelse', 'Friskere krop til næste uge'],
    resume: 'Ingen planlagt hård træning. En rolig time på benene, og så er ugen lukket ordentligt.',
    noter: ['Har du ondt et sted efter ugen, er det i dag, du mærker efter — ikke i morgen under squat.'],
    registrer: ['varighed', 'note']
  }
];

export const SKABELON_INDEX = Object.fromEntries(SKABELONER.map(s => [s.id, s]));

/* ==================================================================
   UGEPLANEN — mandag = 0
================================================================== */
export const UGEPLAN = [
  { ugedag: 0, navn: 'Mandag',  skabelonId: 'bodypump-normal',    gaatur: 60 },
  { ugedag: 1, navn: 'Tirsdag', skabelonId: 'bodypump-let',       gaatur: 60 },
  { ugedag: 2, navn: 'Onsdag',  skabelonId: 'onsdag-roligt-lob',  gaatur: 0, gaaturValgfri: true },
  { ugedag: 3, navn: 'Torsdag', skabelonId: 'bodypump-tung',      gaatur: 60 },
  { ugedag: 4, navn: 'Fredag',  skabelonId: 'fredag-hjemme',      gaatur: 60 },
  { ugedag: 5, navn: 'Lørdag',  skabelonId: 'loerdag-interval',   gaatur: 0, gaaturValgfri: true },
  { ugedag: 6, navn: 'Søndag',  skabelonId: 'sondag-restitution', gaatur: 60, gaaturErTraeningen: true }
];

/**
 * Senere fase — vises diskret, indgår ikke i ugeplanen.
 * Modellen er den samme, så den kan aktiveres uden at ændre noget andet.
 */
export const SENERE = {
  navn: 'Tungere styrketræning i fitnesslokalet',
  resume: 'Én ugentlig tung styrketræning med 6-10 gentagelser, når du får taget fitnesslokalet på arbejdet i brug.',
  oevelser: ['Benpres', 'Brystpres', 'Row', 'Lat pulldown', 'Skulderpres'],
  begrundelse: 'BodyPump er mange gentagelser med let vægt. Én tung dag om ugen er det enkeltgreb, der gør mest for at beholde muskelmassen, mens du taber dig.'
};
