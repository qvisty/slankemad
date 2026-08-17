/**
 * OPSKRIFTER
 *
 * Adskilt fra varekataloget: en opskrift kender kun varenøgler og mængder.
 * Al næring beregnes ud fra varekataloget, så tallene aldrig kan komme i utakt.
 *
 *   ing      [varenoegle, maengde] for antallet af portioner i `basis`
 *   basis    Antal portioner opskriften er skrevet til
 *   tid      Minutter fra køkkenet er tomt til maden står på bordet
 *   kort     Én sætning, der skal gøre dig sulten
 *   tags     Fritekst-mærkater (mærkater som "hurtig"/"proteinrig" beregnes i koden)
 */

export const OPSKRIFTER = [
  // ================= MORGENMAD =================
  {
    id: 'm-skyrbowl', navn: 'Skyrbowl med blåbær og mandler', kategori: 'morgenmad',
    tid: 5, basis: 1, tags: ['lyn', 'ingen-madlavning'],
    kort: 'Iskold skyr, sprøde havregryn og bær, der stadig knaser lidt af frost.',
    ing: [['skyr', 250], ['blaabaer', 80], ['mandler', 15], ['havregryn', 25]],
    fremgang: [
      'Kom skyr i en skål og rør den blød med en gaffel.',
      'Vend de frosne blåbær i — de tør op på et minut og gør skyren iskold og "is-agtig".',
      'Drys havregryn, hakkede mandler og et godt drys kanel over.'
    ],
    tip: 'Kanel + frosne bær er det, der gør den til en dessert i stedet for en kur.'
  },
  {
    id: 'm-havregrod', navn: 'Proteingrød med banan', kategori: 'morgenmad',
    tid: 8, basis: 1, tags: ['varm', 'maetter-laenge'],
    kort: 'Cremet grød, der smager af bananbrød — og holder helt til frokost.',
    ing: [['havregryn', 60], ['minimaelk', 200], ['proteinpulver', 20], ['banan', 1], ['peanutbutter', 10]],
    fremgang: [
      'Kog havregryn og mælk op — 3-4 minutter under omrøring, til det er cremet.',
      'Tag gryden af varmen og lad grøden køle et halvt minut, før du rører proteinpulveret i (så klumper det ikke).',
      'Top med skiver af banan og en klat peanutbutter.'
    ],
    tip: 'Et nip salt i grøden løfter smagen mere end mere sødme gør.'
  },
  {
    id: 'm-roraeg', navn: 'Røræg på rugbrød med avocado', kategori: 'morgenmad',
    tid: 10, basis: 1, tags: ['klassiker'],
    kort: 'Bløde røræg, sprødt rugbrød og en avocado, der gør det hele fedt.',
    ing: [['aeg', 3], ['rugbrod', 80], ['avocado', 0.5], ['cherrytomat', 80], ['olie', 5]],
    fremgang: [
      'Pisk æggene med salt og peber. Varm olien op på middel-lav varme.',
      'Hæld æggene i og rør roligt rundt — tag panden af varmen mens de stadig er lidt bløde.',
      'Server på rugbrød med avocado i skiver og halverede cherrytomater. Chiliflager på toppen.'
    ],
    tip: 'Lav varme = cremet røræg. Høj varme = gummi.'
  },
  {
    id: 'm-omelet', navn: 'Omelet med spinat og feta', kategori: 'morgenmad',
    tid: 12, basis: 1, tags: ['lavt-kulhydrat'],
    kort: 'Gylden omelet med salt feta og champignon stegt mørke i kanten.',
    ing: [['aeg', 3], ['spinat', 60], ['feta', 30], ['champignon', 80], ['olie', 5]],
    fremgang: [
      'Steg champignon i olie ved høj varme til de er gyldne — lad være med at røre for meget.',
      'Tilsæt spinaten og lad den falde sammen (30 sekunder).',
      'Hæld de piskede æg over, skru ned, og drys feta på. Låg på i 3 minutter.'
    ],
    tip: 'Champignon skal have plads i panden, ellers koger de i stedet for at stege.'
  },
  {
    id: 'm-overnight', navn: 'Overnight oats med skyr og hindbær', kategori: 'morgenmad',
    tid: 5, basis: 1, tags: ['forbered-aftenen-for', 'lyn'],
    kort: 'Står klar i køleskabet, når du ikke har tid til at tænke.',
    ing: [['havregryn', 50], ['skyr', 150], ['chiafro', 10], ['hindbaer', 80], ['minimaelk', 100]],
    fremgang: [
      'Rør havregryn, skyr, chiafrø og mælk sammen i et glas eller en lille boks.',
      'Læg hindbærrene på toppen og sæt i køleskabet natten over.',
      'Rør rundt om morgenen — vil du have den tyndere, så spæd med en skvæt mælk.'
    ],
    tip: 'Lav tre glas søndag aften, så er mandag, tirsdag og onsdag klaret.'
  },
  {
    id: 'm-hytteosttoast', navn: 'Rugbrød med hytteost og æg', kategori: 'morgenmad',
    tid: 8, basis: 1, tags: ['lyn'],
    kort: 'Rugbrød med tykt lag hytteost og et æg med blød blomme.',
    ing: [['rugbrod', 80], ['hytteost', 100], ['aeg', 1], ['cherrytomat', 60]],
    fremgang: [
      'Kog ægget 6½ minut og skyl det koldt.',
      'Smør hytteost tykt på rugbrødet og læg tomater i skiver ovenpå.',
      'Halvér ægget, læg det på, og giv det salt, peber og et drys tørret oregano.'
    ],
    tip: 'Hytteost i stedet for smør: samme fylde, dobbelt så meget protein.'
  },
  {
    id: 'm-smoothie', navn: 'Proteinsmoothie med banan og blåbær', kategori: 'morgenmad',
    tid: 3, basis: 1, tags: ['lyn', 'to-go'],
    kort: 'Tre minutter, ét glas, over 30 gram protein.',
    ing: [['skyr', 150], ['banan', 1], ['blaabaer', 80], ['proteinpulver', 15], ['minimaelk', 200]],
    fremgang: [
      'Kom det hele i blenderen med 3-4 isterninger.',
      'Blend 30 sekunder til den er helt glat.',
      'Drik den med det samme — den skiller lidt, hvis den står.'
    ],
    tip: 'Skal du direkte til Bodypump, så tag den 45-60 minutter før — så ligger den ikke tungt.'
  },
  {
    id: 'm-pandekager', navn: 'Skyrpandekager med bær', kategori: 'morgenmad',
    tid: 15, basis: 1, tags: ['weekend'],
    kort: 'Tykke pandekager med varme bær — weekendens bedste undskyldning.',
    ing: [['aeg', 2], ['havregryn', 40], ['skyr', 100], ['proteinpulver', 15], ['blaabaer', 80]],
    fremgang: [
      'Blend havregryn, æg, halvdelen af skyren og proteinpulveret til en jævn dej.',
      'Bag små pandekager på en varm pande med lidt olie — ca. 1½ minut på hver side.',
      'Stabl dem, top med resten af skyren og de varme bær (30 sekunder i mikroovnen med lidt kanel).'
    ],
    tip: 'Weekendens "snyd", der ikke er snyd. Ca. 40 g protein i en stak pandekager.'
  },

  {
    id: 'm-spejlaeg', navn: 'Spejlæg på rugbrød med ost', kategori: 'morgenmad',
    tid: 10, basis: 1, tags: ['weekend', 'klassiker'],
    kort: 'Weekendens morgenmad: blomme der løber, sprødt rugbrød, en skive ost.',
    ing: [['aeg', 3], ['rugbrod', 80], ['ost', 25], ['cherrytomat', 80], ['olie', 6]],
    fremgang: [
      'Varm olien op på middel varme — ikke høj, ellers bliver hviden brun og sej, før blommen er varm.',
      'Slå æggene i og læg låg på i to minutter. Så bliver hviden sat, og blommen løber stadig.',
      'Rist rugbrødet, læg ost på den ene skive, og lad spejlæggene glide ovenpå.',
      'Salt, groft peber og halverede tomater ved siden af.'
    ],
    tip: 'Låg på panden er forskellen på et spejlæg og et halvfærdigt spejlæg.'
  },

  // ================= FROKOST =================
  {
    id: 'f-tacosalat', navn: 'Kylling-tacosalat med lime og sriracha-dressing', kategori: 'frokost',
    tid: 15, basis: 2, tags: ['lyn', 'meal-prep'],
    kort: 'Alt det gode fra en taco i en skål, med syre og styrke fra lime og sriracha.',
    ing: [['kyllingebryst', 300], ['salatmix', 150], ['majs', 100], ['sortebonner', 120], ['cherrytomat', 150],
          ['skyr', 100], ['sriracha', 15], ['lime', 1], ['krydderi', 6], ['olie', 8]],
    fremgang: [
      'Skær kyllingen i strimler, vend den i paprika, spidskommen og salt, og steg den 6-7 minutter ved høj varme.',
      'Rør skyr, sriracha, limesaft og et nip salt sammen til en dressing.',
      'Byg salaten: salatmix i bunden, så bønner, majs og tomater, kyllingen øverst og dressingen hen over.'
    ],
    tip: 'Lav dobbelt op af kyllingen — så er morgendagens frokost ren samlebåndsarbejde.'
  },
  {
    id: 'f-tunsalat', navn: 'Tunsalat med kikærter, majs og rødløg', kategori: 'frokost',
    tid: 10, basis: 2, tags: ['lyn', 'ingen-madlavning', 'meal-prep'],
    kort: 'Proteinbomben, du kan lave af det, der allerede står i skabet.',
    ing: [['tun', 260], ['kikaerter', 240], ['majs', 100], ['rodlog', 60], ['agurk', 150],
          ['skyr', 100], ['citron', 1], ['knaekbrod', 4], ['persille', 10]],
    fremgang: [
      'Dræn tun, kikærter og majs godt af.',
      'Vend det med finthakket rødløg, agurk i tern og hakket persille.',
      'Rør skyr med citronsaft, salt og peber, og vend det hele sammen. Server med knækbrød.'
    ],
    tip: 'Holder sig fint 2 dage i køleskabet — den bliver faktisk bedre dag 2.'
  },
  {
    id: 'f-prepbowl', navn: 'Meal-prep bowl med kylling og bulgur', kategori: 'frokost',
    tid: 20, basis: 2, tags: ['meal-prep'],
    kort: 'Bowlen, du laver én gang og glæder dig til to dage i træk.',
    ing: [['kyllingebryst', 300], ['bulgur', 100], ['agurk', 150], ['cherrytomat', 150], ['feta', 40],
          ['gyoghurt', 100], ['hvidlog', 1], ['citron', 1], ['olie', 8], ['krydderi', 5]],
    fremgang: [
      'Kog bulguren efter anvisningen (ca. 10 min) — den passer sig selv.',
      'Steg krydret kylling i strimler imens.',
      'Riv den halve agurk groft, pres vandet ud, og rør den med yoghurt, presset hvidløg, citron og salt.',
      'Saml i to bokse: bulgur, kylling, resten af agurken, tomater, feta — tzatziki i et lille glas ved siden af.'
    ],
    tip: 'Tzatziki ved siden af, ikke i boksen. Ellers bliver bunden vandet dag 2.'
  },
  {
    id: 'f-laksesalat', navn: 'Laksesalat med edamame og avocado', kategori: 'frokost',
    tid: 15, basis: 2, tags: ['omega-3'],
    kort: 'Sprød salat, varm laks og sesam — frokost med restaurantfølelse.',
    ing: [['laks', 250], ['edamame', 150], ['salatmix', 150], ['avocado', 1], ['forarslog', 30],
          ['soja', 20], ['lime', 1], ['sesam', 8], ['ingefaer', 8]],
    fremgang: [
      'Steg laksen 3 minutter på skindsiden og 2 minutter på den anden — den må gerne være lidt rosa i midten.',
      'Kog edamame 3 minutter i saltet vand.',
      'Rør soja, limesaft og revet ingefær sammen til en dressing.',
      'Fordel salat, edamame og avocado, læg laksen ovenpå i flager, dressing og sesam over.'
    ],
    tip: 'Fed fisk 2 gange om ugen — det er en af de få kostvaner, der er værd at være firkantet omkring.'
  },
  {
    id: 'f-wrap', navn: 'Hummuswrap med kikærter og spinat', kategori: 'frokost',
    tid: 10, basis: 2, tags: ['vegetarisk', 'lyn', 'to-go'],
    kort: 'Cremet hummus, krydrede kikærter og masser af crunch.',
    ing: [['tortilla', 4], ['hummus', 80], ['kikaerter', 240], ['spinat', 80], ['peberfrugt', 150],
          ['feta', 50], ['citron', 1], ['krydderi', 4]],
    fremgang: [
      'Vend de drænede kikærter med paprika, spidskommen, citronsaft og salt — mos ca. en tredjedel med en gaffel.',
      'Smør hummus på tortillaerne, læg spinat, kikærter, peberfrugt i strimler og feta på.',
      'Rul stramt, skær over på skrå. Varm evt. 1 minut på en tør pande for sprødhed.'
    ],
    tip: 'Mos en del af kikærterne — så falder fyldet ikke ud af wrappen.'
  },
  {
    id: 'f-rejesalat', navn: 'Rejesalat med avocado og chili-lime', kategori: 'frokost',
    tid: 10, basis: 2, tags: ['lyn', 'lavt-kulhydrat'],
    kort: 'Let, frisk og syrlig — og klar på ti minutter.',
    ing: [['rejer', 250], ['avocado', 1], ['agurk', 200], ['salatmix', 120], ['rodlog', 40],
          ['lime', 1], ['olie', 10], ['persille', 10], ['knaekbrod', 4]],
    fremgang: [
      'Tø rejerne i koldt vand (5 minutter) og dup dem tørre.',
      'Bland salat, agurk i halvmåner, tyndt rødløg og avocado i tern.',
      'Vend rejerne i limesaft, olie, chiliflager og salt, og læg dem øverst. Knækbrød til.'
    ],
    tip: 'Dup rejerne rigtig tørre — våde rejer udvander hele salaten.'
  },
  {
    id: 'f-pastasalat', navn: 'Pestopastasalat med kylling', kategori: 'frokost',
    tid: 20, basis: 2, tags: ['meal-prep'],
    kort: 'Pesto rørt op i skyr, så den smager fed uden at være det.',
    ing: [['pasta', 140], ['kyllingebryst', 300], ['cherrytomat', 200], ['spinat', 80], ['pesto', 30],
          ['skyr', 60], ['parmesan', 15], ['citron', 1]],
    fremgang: [
      'Kog pastaen al dente og skyl den kort i koldt vand.',
      'Steg kyllingen i tern med salt og peber.',
      'Rør pesto med skyr og citronsaft — det strækker pestoen, så du får smagen uden alt fedtet.',
      'Vend pasta, kylling, tomater og spinat i dressingen. Parmesan over.'
    ],
    tip: 'Pesto rørt op med skyr: halv så mange kalorier, samme smag.'
  },
  {
    id: 'f-linsesuppe', navn: 'Krydret linsesuppe med gulerod', kategori: 'frokost',
    tid: 25, basis: 4, tags: ['vegetarisk', 'meal-prep', 'batch'],
    kort: 'Varm, krydret og mættende. Én gryde, fire frokoster.',
    ing: [['linser', 250], ['gulerod', 400], ['log', 150], ['hvidlog', 3], ['hakkedetomater', 400],
          ['bouillon', 20], ['krydderi', 10], ['olie', 15], ['gyoghurt', 120], ['persille', 15]],
    fremgang: [
      'Svits løg, hvidløg og gulerødder i tern i olien i 5 minutter.',
      'Tilsæt spidskommen og paprika, rør et halvt minut, så det dufter.',
      'Kom linser, tomater, bouillon og 1 liter vand i. Kog 15 minutter til linserne er møre.',
      'Blend halvdelen for cremethed. Server med en klat græsk yoghurt og persille.'
    ],
    tip: 'Én gryde = fire frokoster. Fryser fint i portionsbokse.'
  },
  {
    id: 'f-greenbowl', navn: 'Grøn powerbowl med æg og edamame', kategori: 'frokost',
    tid: 12, basis: 2, tags: ['vegetarisk', 'lyn'],
    kort: 'Grønt, æg og kerner — skålen, der faktisk holder til klokken 17.',
    ing: [['aeg', 4], ['edamame', 160], ['salatmix', 150], ['avocado', 1], ['gulerod', 150],
          ['graeskarkerner', 20], ['skyr', 80], ['sennep', 10], ['citron', 1]],
    fremgang: [
      'Kog æggene 7 minutter, så blommen lige akkurat er cremet.',
      'Kog edamame 3 minutter. Riv gulerødderne groft.',
      'Rør skyr, sennep, citron, salt og peber til dressing.',
      'Byg bowlen, halvér æggene ovenpå og drys græskarkerner over.'
    ],
    tip: 'Græskarkerner giver crunch — det er ofte teksturen, ikke kalorierne, man savner.'
  },
  {
    id: 'f-aeggesalat', navn: 'Rugbrødsmad med skyr-æggesalat og karse', kategori: 'frokost',
    tid: 12, basis: 2, tags: ['vegetarisk', 'klassiker'],
    kort: 'Æggesalat uden mayonnaise, der stadig smager af æggesalat.',
    ing: [['aeg', 5], ['skyr', 120], ['sennep', 10], ['forarslog', 30], ['rugbrod', 160], ['cherrytomat', 120]],
    fremgang: [
      'Kog æggene hårde (9 minutter), skyl dem kolde og hak dem groft.',
      'Rør skyr, sennep, salt, peber og finthakket forårsløg sammen, og vend æggene i.',
      'Smør det på rugbrød og læg tomatskiver ovenpå.'
    ],
    tip: 'Skyr i stedet for mayonnaise er den ene udskiftning, du aldrig kommer til at savne.'
  },

  // ================= AFTENSMAD =================
  {
    id: 'a-fajita', navn: 'One-pan fajitakylling med lime-skyr', kategori: 'aftensmad',
    tid: 25, basis: 2, tags: ['en-pande', 'familie'],
    kort: 'Én bageplade, tyve minutter, og hele køkkenet dufter af fajita.',
    ing: [['kyllingebryst', 400], ['peberfrugt', 300], ['rodlog', 150], ['tortilla', 4], ['skyr', 120],
          ['lime', 1], ['krydderi', 10], ['olie', 12], ['salatmix', 80]],
    fremgang: [
      'Tænd ovnen på 220°. Vend kylling i strimler, peberfrugt og løg med olie, paprika, spidskommen, chili og salt.',
      'Spred det ud på en bageplade i ét lag og bag 18-20 minutter.',
      'Rør skyr med limesaft og lidt salt.',
      'Varm tortillaerne og fyld dem med det bagte, salat og en stribe lime-skyr.'
    ],
    tip: 'Ét lag på pladen — ligger det i bunker, damper det i stedet for at brune.'
  },
  {
    id: 'a-frikadeller', navn: 'Frikadeller med tzatziki og ovngrønt', kategori: 'aftensmad',
    tid: 30, basis: 2, tags: ['familie', 'meal-prep'],
    kort: 'Saftige frikadeller, kølig tzatziki og ovnbagt grønt med mørke kanter.',
    ing: [['hakketkalkun', 400], ['aeg', 1], ['havregryn', 30], ['log', 80], ['squash', 300],
          ['peberfrugt', 200], ['gyoghurt', 120], ['agurk', 120], ['hvidlog', 2], ['olie', 12], ['krydderi', 8]],
    fremgang: [
      'Tænd ovnen på 220°. Vend squash og peberfrugt i tern med olie og krydderier, og bag 20 minutter.',
      'Rør fars af kalkun, æg, havregryn, revet løg, salt, peber og oregano. Lad den hvile 5 minutter.',
      'Form små frikadeller og steg dem 4 minutter på hver side.',
      'Riv agurken, pres vandet ud og rør den med yoghurt og presset hvidløg.'
    ],
    tip: 'Havregryn i stedet for rasp: mere fiber, og farsen bliver mere saftig.'
  },
  {
    id: 'a-laksovn', navn: 'Ovnbagt laks med sprød broccoli', kategori: 'aftensmad',
    tid: 25, basis: 2, tags: ['en-plade', 'omega-3'],
    kort: 'Laks, sprød broccoli og kartoffelbåde — alt sammen fra samme plade.',
    ing: [['laks', 300], ['broccoli', 400], ['kartofler', 500], ['citron', 1], ['olie', 15], ['hvidlog', 2], ['persille', 10]],
    fremgang: [
      'Ovn på 220°. Skær kartoflerne i både, vend dem i olie og salt, og bag dem 15 minutter.',
      'Skub kartoflerne til side, læg broccolibuketter og laks på pladen med citronskiver.',
      'Bag 10-12 minutter mere. Presset hvidløg og persille over til sidst.'
    ],
    tip: 'Broccoli direkte på pladen (ikke kogt) — sprøde kanter er hele forskellen.'
  },
  {
    id: 'a-karry', navn: 'Rød karry med kylling og blomkålsris', kategori: 'aftensmad',
    tid: 20, basis: 2, tags: ['lyn', 'lavt-kulhydrat'],
    kort: 'Cremet rød karry med bid i grøntsagerne og fart på.',
    ing: [['kyllingebryst', 400], ['karrypasta', 30], ['kokosmaelk', 250], ['broccoli', 250], ['peberfrugt', 150],
          ['blomkaalsris', 400], ['lime', 1], ['soja', 10], ['olie', 8]],
    fremgang: [
      'Steg karrypastaen 30 sekunder i olien, til den dufter.',
      'Tilsæt kylling i tern og brun den kort. Hæld kokosmælk i og lad det simre 5 minutter.',
      'Kom broccoli og peberfrugt i og lad det simre 5 minutter mere — grøntsagerne skal have bid.',
      'Steg blomkålsrisen 4 minutter på en tør, varm pande. Smag karryen til med lime og soja.'
    ],
    tip: 'Blomkålsris i stedet for ris sparer ~200 kcal og gør portionen dobbelt så stor.'
  },
  {
    id: 'a-bolognese', navn: 'Bolognese med kalkun og masser af grønt', kategori: 'aftensmad',
    tid: 25, basis: 4, tags: ['familie', 'batch'],
    kort: 'Bolognese med skjult grønt, der smager, som om den har simret hele dagen.',
    ing: [['hakketkalkun', 500], ['hakkedetomater', 800], ['gulerod', 250], ['squash', 250], ['log', 150],
          ['hvidlog', 3], ['tomatpure', 60], ['pasta', 280], ['parmesan', 40], ['olie', 15], ['krydderi', 8]],
    fremgang: [
      'Riv gulerod og squash groft — det forsvinder helt i saucen og fordobler portionen.',
      'Brun kalkunfarsen godt, tilsæt løg, hvidløg og de revne grøntsager, og svits 5 minutter.',
      'Tomatpuré i, rør et minut, og hæld så de hakkede tomater ved. Simr 10-15 minutter med oregano, salt og peber.',
      'Kog pastaen imens. Parmesan over ved serveringen.'
    ],
    tip: 'Det revne grønt er tricket: samme tallerken, langt færre kalorier, ingen der opdager det.'
  },
  {
    id: 'a-torsk', navn: 'Bagt torsk med sennepssauce', kategori: 'aftensmad',
    tid: 25, basis: 2, tags: ['let'],
    kort: 'Sprød sennepssauce til mør torsk. Gammeldags god, bare let.',
    ing: [['torsk', 400], ['kartofler', 500], ['aerter', 250], ['gyoghurt', 100], ['sennep', 15],
          ['citron', 1], ['persille', 10], ['olie', 10]],
    fremgang: [
      'Kog kartoflerne. Ovn på 200°.',
      'Læg torsken i et fad, dryp med olie, salt og citron, og bag 12-14 minutter.',
      'Rør græsk yoghurt, sennep, citronsaft og persille til en kold sauce.',
      'Damp ærterne 2 minutter. Server det hele med saucen ved siden af.'
    ],
    tip: 'Torsk er færdig, når kødet lige akkurat deler sig i flager — et minut for meget gør den tør.'
  },
  {
    id: 'a-burger', navn: 'Kalkunburger med avocado og sweet chili', kategori: 'aftensmad',
    tid: 20, basis: 2, tags: ['fredag', 'familie'],
    kort: 'Rigtig burger med avocado og sweet chili. Fredag er reddet.',
    ing: [['hakketkalkun', 400], ['burgerbolle', 2], ['avocado', 1], ['salatmix', 60], ['rodlog', 50],
          ['cherrytomat', 100], ['skyr', 60], ['sweetchili', 20], ['krydderi', 5], ['olie', 8]],
    fremgang: [
      'Bland farsen med salt, peber og paprika, og form to store, flade bøffer.',
      'Steg dem 4-5 minutter på hver side ved god varme — tryk dem ikke flade undervejs.',
      'Rør skyr og sweet chili til en dressing.',
      'Rist bollerne kort og byg: salat, bøf, avocado, tomat, rødløg, dressing.'
    ],
    tip: 'Burgeraften uden dårlig samvittighed — proteinen er høj, og pomfritterne er byttet til en stor salat.'
  },
  {
    id: 'a-chili', navn: 'Chili con carne med sorte bønner', kategori: 'aftensmad',
    tid: 30, basis: 4, tags: ['batch', 'meal-prep'],
    kort: 'Krydret, dyb og mættende — og bedre dagen efter.',
    ing: [['hakketokse', 500], ['sortebonner', 480], ['hakkedetomater', 800], ['peberfrugt', 200], ['log', 150],
          ['hvidlog', 3], ['tomatpure', 60], ['krydderi', 12], ['ris', 200], ['skyr', 120], ['olie', 12]],
    fremgang: [
      'Brun oksekødet godt af — lad det ligge stille et par minutter, så det får stegeskorpe.',
      'Tilsæt løg, hvidløg og peberfrugt i tern, og svits 5 minutter.',
      'Spidskommen, paprika og chili i, så tomatpuré, tomater og drænede bønner. Simr 15 minutter.',
      'Kog risene. Server med en klat skyr på toppen.'
    ],
    tip: 'Bønnerne er halvdelen af mætheden. Skær ikke ned på dem for at få plads til mere kød.'
  },
  {
    id: 'a-shawarma', navn: 'Shawarmabowl med kylling og hvidløgsdressing', kategori: 'aftensmad',
    tid: 25, basis: 2, tags: ['takeaway-følelse'],
    kort: 'Sprødstegt shawarmakylling og hvidløgsdressing. Takeaway uden takeaway.',
    ing: [['kyllingelaar', 400], ['bulgur', 120], ['salatmix', 120], ['rodlog', 60], ['cherrytomat', 150],
          ['agurk', 150], ['skyr', 120], ['hvidlog', 2], ['citron', 1], ['krydderi', 10], ['olie', 12]],
    fremgang: [
      'Vend kyllingen i strimler med olie, spidskommen, paprika, gurkemeje, hvidløg og salt.',
      'Steg den ved høj varme til kanterne er mørke og sprøde — det er dér smagen sidder.',
      'Kog bulguren (10 min).',
      'Rør skyr med presset hvidløg, citron og salt, og byg bowlen med det hele.'
    ],
    tip: 'Overlår i stedet for bryst her — de tåler den høje varme og bliver ikke tørre.'
  },
  {
    id: 'a-stegteris', navn: 'Stegte ris med rejer, æg og edamame', kategori: 'aftensmad',
    tid: 15, basis: 2, tags: ['lyn', 'rester'],
    kort: 'Femten minutter fra køleskab til bord, med rejer og æg.',
    ing: [['ris', 160], ['rejer', 250], ['aeg', 2], ['edamame', 150], ['gulerod', 150], ['forarslog', 40],
          ['soja', 25], ['ingefaer', 10], ['hvidlog', 2], ['olie', 10]],
    fremgang: [
      'Kog risene (eller brug rester fra i går — de bliver faktisk bedst).',
      'Steg revet gulerod, ingefær og hvidløg 2 minutter ved høj varme.',
      'Skub til side, hæld de piskede æg i og rør dem sammen.',
      'Ris, rejer og edamame i. Soja over, vend det hele rundt i 2 minutter, forårsløg til sidst.'
    ],
    tip: 'Kog risene dagen før — kolde ris klistrer ikke sammen på panden.'
  },
  {
    id: 'a-skillet', navn: 'Lasagne-skillet med kalkun og squash', kategori: 'aftensmad',
    tid: 25, basis: 2, tags: ['en-pande', 'comfort'],
    kort: 'Al lasagnens smag i én pande, med bobler af smeltet ost.',
    ing: [['hakketkalkun', 400], ['squash', 400], ['hakkedetomater', 400], ['log', 100], ['hvidlog', 2],
          ['mozzarella', 80], ['tomatpure', 40], ['krydderi', 8], ['olie', 10], ['spinat', 80]],
    fremgang: [
      'Brun farsen med løg og hvidløg i en stor pande.',
      'Tilsæt squash i tern, tomatpuré, hakkede tomater, oregano, salt og peber. Simr 10 minutter.',
      'Rør spinaten i til den falder sammen.',
      'Drys mozzarella over, låg på i 4 minutter — eller under grill i ovnen til den bobler.'
    ],
    tip: 'Al lasagnens smag, ingen plader, halv tid — og cirka det halve af kalorierne.'
  },
  {
    id: 'a-graeskkylling', navn: 'Græsk ovnkylling med feta og tomat', kategori: 'aftensmad',
    tid: 30, basis: 2, tags: ['en-plade', 'familie'],
    kort: 'Ét fad med citronkylling, feta og tomater, der næsten bliver til sauce.',
    ing: [['kyllingelaar', 450], ['cherrytomat', 300], ['squash', 250], ['rodlog', 120], ['feta', 80],
          ['olie', 15], ['hvidlog', 3], ['citron', 1], ['krydderi', 8], ['kartofler', 400]],
    fremgang: [
      'Ovn på 210°. Læg kartoffelbåde, squash, løg og tomater i et fad.',
      'Læg kyllingen ovenpå, dryp med olie, citron, oregano, hvidløg og salt.',
      'Bag 25 minutter. Smuldr feta over de sidste 5 minutter.'
    ],
    tip: 'Ét fad, én opvask. Rester er en fremragende frokost dagen efter.'
  },
  {
    id: 'a-tacos', navn: 'Tacos med krydret oksekød og limecreme', kategori: 'aftensmad',
    tid: 20, basis: 2, tags: ['fredag', 'familie'],
    kort: 'Byg-selv-tacos, hvor du spiser med — ikke ved siden af.',
    ing: [['hakketokse', 400], ['tortilla', 6], ['salatmix', 120], ['majs', 100], ['sortebonner', 120],
          ['cherrytomat', 150], ['rodlog', 60], ['skyr', 120], ['lime', 1], ['krydderi', 10], ['olie', 8]],
    fremgang: [
      'Brun oksekødet og krydr det godt med spidskommen, paprika, chili, oregano og salt. En skvæt vand gør det saftigt.',
      'Lav en hurtig salsa af hakkede tomater, rødløg, majs, bønner, limesaft og salt.',
      'Rør skyr med limeskal og salt.',
      'Varm tortillaerne og lad alle bygge selv.'
    ],
    tip: 'Byg-selv-tacos er den nemmeste måde at spise sammen med familien uden at spise som dem.'
  },
  {
    id: 'a-sodkartoffel', navn: 'Sød kartoffel-bowl med kikærter', kategori: 'aftensmad',
    tid: 25, basis: 2, tags: ['vegetarisk', 'en-plade'],
    kort: 'Sprøde kikærter, søde kartofler og en peanutdressing, man vil have mere af.',
    ing: [['sodkartoffel', 500], ['kikaerter', 480], ['spinat', 100], ['rodlog', 80], ['peanutbutter', 30],
          ['soja', 20], ['lime', 1], ['sriracha', 10], ['olie', 12], ['krydderi', 6], ['graeskarkerner', 20]],
    fremgang: [
      'Ovn på 220°. Vend søde kartofler i tern og drænede kikærter med olie, paprika og spidskommen. Bag 20-22 minutter.',
      'Rør peanutbutter, soja, limesaft, sriracha og 2-3 spsk varmt vand til en glat dressing.',
      'Vend spinat og tyndt rødløg i det varme fra pladen, så spinaten lige falder sammen.',
      'Dressing over, græskarkerner på.'
    ],
    tip: 'Kikærter bagt sprøde er kødfri mad, man rent faktisk glæder sig til.'
  },
  {
    id: 'a-pestolaks', navn: 'Pestolaks med fuldkornspasta', kategori: 'aftensmad',
    tid: 20, basis: 2, tags: ['lyn', 'omega-3'],
    kort: 'Laks, pesto og tomater, der springer i panden. Tyve minutter.',
    ing: [['laks', 300], ['pasta', 140], ['cherrytomat', 250], ['spinat', 100], ['pesto', 30],
          ['skyr', 60], ['citron', 1], ['parmesan', 20], ['hvidlog', 2]],
    fremgang: [
      'Sæt pastaen over. Steg laksen 3-4 minutter på hver side og del den i grove flager.',
      'Steg tomaterne kort ved høj varme med hvidløg, til de springer.',
      'Vend den kogte pasta i pesto rørt med skyr og lidt pastavand.',
      'Spinat, tomater og laks i. Citron og parmesan over.'
    ],
    tip: 'Gem altid en kop pastavand — det binder saucen uden fløde.'
  },

  {
    id: 'f-caesar', navn: 'Kyllingesalat med parmesan', kategori: 'frokost',
    tid: 15, basis: 2, tags: ['salat', 'lyn', 'favorit'],
    kort: 'Caesar-følelsen med sprøde rugbrødscroutoner og cremet citrondressing.',
    ing: [['kyllingebryst', 350], ['salatmix', 200], ['cherrytomat', 150], ['agurk', 150], ['parmesan', 25],
          ['skyr', 100], ['sennep', 10], ['hvidlog', 1], ['citron', 1], ['rugbrod', 60], ['olie', 10]],
    fremgang: [
      'Skær rugbrødet i små tern og rist dem sprøde på en tør pande — de er dine croutoner.',
      'Steg kyllingen i skiver med salt og peber, til kanterne er gyldne.',
      'Rør skyr, sennep, presset hvidløg, citronsaft, halvdelen af parmesanen, salt og peber til en cremet dressing.',
      'Vend salat, agurk og tomater i dressingen, læg kyllingen og croutonerne på, og riv resten af parmesanen over.'
    ],
    tip: 'Caesar-følelsen uden mayonnaisen: skyr + sennep + parmesan gør præcis det samme arbejde.'
  },
  {
    id: 'f-tunpoke', navn: 'Tun-pokebowl med avocado', kategori: 'frokost',
    tid: 15, basis: 2, tags: ['salat', 'lyn', 'meal-prep', 'favorit'],
    kort: 'Farverig bowl med tun, avocado og soja-lime. Den bedste madpakke på listen.',
    ing: [['tun', 260], ['ris', 120], ['edamame', 150], ['avocado', 1], ['agurk', 150], ['gulerod', 120],
          ['rodlog', 40], ['soja', 25], ['lime', 1], ['sesam', 8], ['sriracha', 10]],
    fremgang: [
      'Kog risene og lad dem køle lidt af (eller brug rester fra i går).',
      'Kog edamame 3 minutter. Skær agurk i halvmåner, riv guleroden, snit rødløget tyndt.',
      'Vend den drænede tun i soja, limesaft og sriracha.',
      'Byg bowlen i felter: ris i bunden, så grøntsager, tun og avocado. Sesam over.'
    ],
    tip: 'Bygget i en boks med dressingen for sig er det den bedste madpakke på listen.'
  },
  {
    id: 'a-sesamlaks', navn: 'Sesamlaks med agurksalat', kategori: 'aftensmad',
    tid: 20, basis: 2, tags: ['lyn', 'omega-3', 'favorit'],
    kort: 'Klistret sesamlaks med sprød agurksalat — restaurant på en tirsdag.',
    ing: [['laks', 300], ['ris', 150], ['agurk', 250], ['gulerod', 120], ['forarslog', 30], ['soja', 25],
          ['honning', 10], ['sesam', 10], ['lime', 1], ['ingefaer', 10], ['broccoli', 200]],
    fremgang: [
      'Sæt risene over. Rør soja, honning, revet ingefær og limesaft sammen.',
      'Steg laksen 3 minutter på skindsiden, vend den, og pensl med halvdelen af saucen. 2-3 minutter mere.',
      'Damp broccolien 4 minutter. Skær agurk og gulerod i tynde skiver og vend dem i resten af saucen.',
      'Server laksen på risene med agurksalaten ved siden af og sesam over.'
    ],
    tip: 'Honningen karamelliserer på laksen — 10 g til to personer er nok til at gøre hele retten "restaurant".'
  },

  {
    id: 'a-linsebolognese', navn: 'Linsebolognese med masser af grønt', kategori: 'aftensmad',
    tid: 25, basis: 4, tags: ['vegetarisk', 'batch', 'familie'],
    kort: 'Kødfri bolognese med bid i — den sniger sig ind på selv de skeptiske.',
    ing: [['linser', 220], ['hakkedetomater', 800], ['gulerod', 250], ['squash', 200], ['log', 150],
          ['hvidlog', 3], ['tomatpure', 60], ['pasta', 280], ['olie', 15], ['krydderi', 8], ['parmesan', 30]],
    fremgang: [
      'Riv gulerod og squash groft og svits det med hakket løg og hvidløg i olien i 5 minutter.',
      'Tilsæt tomatpuré og krydderier, rør et minut, og kom så linser og hakkede tomater i sammen med 3 dl vand.',
      'Lad det simre 15 minutter, til linserne er møre og saucen tyk. Smag godt til med salt, peber og oregano.',
      'Kog pastaen imens, og riv parmesan over ved serveringen.'
    ],
    tip: 'Røde linser koger ud og bliver til sauce — det er dem, der giver den kødagtige fylde.'
  },
  {
    id: 'a-kikaertekarry', navn: 'Kikærtekarry med spinat og edamame', kategori: 'aftensmad',
    tid: 22, basis: 2, tags: ['vegetarisk', 'lyn', 'laktosefri'],
    kort: 'Cremet, krydret og mættende — uden et gram mælkeprodukt.',
    ing: [['kikaerter', 480], ['kokosmaelk', 250], ['karrypasta', 30], ['spinat', 150], ['edamame', 150],
          ['sodkartoffel', 350], ['ris', 120], ['lime', 1], ['olie', 10], ['ingefaer', 10]],
    fremgang: [
      'Sæt risene over. Steg karrypasta og revet ingefær 30 sekunder i olien.',
      'Kom søde kartofler i tern og kokosmælk i, og lad det simre 10-12 minutter under låg.',
      'Tilsæt drænede kikærter og edamame, og lad det få 3 minutter mere.',
      'Rør spinaten i til den falder sammen, og smag til med limesaft og salt.'
    ],
    tip: 'Kikærter og edamame sammen giver en kødfri ret, der faktisk mætter til næste morgen.'
  },
  {
    id: 'm-aeggemuffins', navn: 'Æggemuffins med peberfrugt og spinat', kategori: 'morgenmad',
    tid: 25, basis: 2, tags: ['meal-prep', 'laktosefri', 'lavt-kulhydrat'],
    kort: 'Bag én gang søndag, spis morgenmad tre dage uden at tænke.',
    ing: [['aeg', 6], ['peberfrugt', 150], ['spinat', 80], ['forarslog', 30], ['olie', 8], ['krydderi', 4]],
    fremgang: [
      'Tænd ovnen på 180°. Hak peberfrugt, spinat og forårsløg fint.',
      'Pisk æggene med salt, peber og paprika, og vend grøntsagerne i.',
      'Fordel i en smurt muffinform og bag 18-20 minutter, til de er lige akkurat faste.',
      'De holder sig fire dage i køleskabet og kan spises kolde eller lunet 30 sekunder.'
    ],
    tip: 'Tag dem ud, når de stadig hæver lidt — de sætter sig selv de sidste to minutter.'
  },
  {
    id: 'f-kyllingsalat', navn: 'Kyllingesalat med avocado og lime', kategori: 'frokost',
    tid: 15, basis: 2, tags: ['salat', 'lyn', 'laktosefri', 'favorit'],
    kort: 'Sprød salat, varm kylling og en dressing der kun er lime, olie og salt.',
    ing: [['kyllingebryst', 320], ['salatmix', 150], ['avocado', 1], ['majs', 100], ['cherrytomat', 150],
          ['rodlog', 40], ['lime', 1], ['olie', 12], ['krydderi', 5], ['graeskarkerner', 20]],
    fremgang: [
      'Vend kyllingen i strimler med paprika, spidskommen og salt, og steg den 6-7 minutter ved høj varme.',
      'Bland salat, majs, halverede tomater og tyndt snittet rødløg i en stor skål.',
      'Pisk limesaft, olie, salt og peber sammen og vend salaten i det.',
      'Læg kyllingen og avocado i både øverst, og drys græskarkerner over.'
    ],
    tip: 'Lad kyllingen hvile to minutter, før du lægger den på — ellers udvander den salaten.'
  },
  {
    id: 'f-tunbowl', navn: 'Tunbowl med kikærter og sprødt grønt', kategori: 'frokost',
    tid: 10, basis: 2, tags: ['lyn', 'ingen-madlavning', 'laktosefri', 'favorit'],
    kort: 'Ti minutter, ingen pande, og protein nok til at holde til aftensmaden.',
    ing: [['tun', 260], ['kikaerter', 240], ['agurk', 150], ['cherrytomat', 150], ['peberfrugt', 120],
          ['rodlog', 40], ['olie', 12], ['citron', 1], ['persille', 10], ['graeskarkerner', 20]],
    fremgang: [
      'Dræn tun og kikærter godt af.',
      'Skær agurk, tomater og peberfrugt i grove tern og snit rødløget tyndt.',
      'Vend det hele med olie, citronsaft, hakket persille, salt og peber.',
      'Græskarkerner over til sidst, så der er noget at bide i.'
    ],
    tip: 'Bygget i en boks holder den to dage — bare vent med citronen til du spiser den.'
  },

  /* ================= UDE: KANTINE OG BUFFET =================
     Måltider, du ikke selv laver. De havner aldrig på indkøbslisten, men de
     tæller med i dine kalorier og makroer, så ugen hænger sammen.
     Mængderne er kvalificerede skøn på, hvad du tager på tallerkenen — ikke
     opskrifter. Justér dem efter, hvad der faktisk står frem. */
  {
    id: 'u-skyr', navn: 'Skyr med havregryn, frugt og kerner', kategori: 'morgenmad',
    ude: true, sted: 'Buffeten', tid: 3, basis: 1, tags: ['ude', 'lyn'],
    kort: 'Buffetens bedste bytte: skyr i bunden, alt det andet ovenpå.',
    ing: [['skyr', 300], ['havregryn', 40], ['banan', 1], ['blaabaer', 60], ['graeskarkerner', 15]],
    fremgang: [
      'Fyld skålen halvt op med skyr, før du gør noget andet. Det er hele forskellen på denne morgenmad og en skål müsli.',
      'Havregryn oveni — ikke müsli eller cornflakes, hvis du kan vælge. Et par spiseskefulde, ikke en øse.',
      'Frugt og et drys kerner på toppen.'
    ],
    tip: 'Er der kun én ting, du gør ved buffeten, så er det at tage skyren først og brødet bagefter.'
  },
  {
    id: 'u-skyr-aeg', navn: 'Skyr med bær og et blødkogt æg', kategori: 'morgenmad',
    ude: true, sted: 'Buffeten', tid: 3, basis: 1, tags: ['ude', 'lyn', 'favorit'],
    kort: 'Samme skyr som ellers — men med et æg ved siden af bliver den mættende hele formiddagen.',
    ing: [['skyr', 300], ['blaabaer', 60], ['havregryn', 25], ['aeg', 1]],
    fremgang: [
      'Fyld skålen halvt op med skyr, før du tager noget andet.',
      'Bær og et par spiseskefulde havregryn ovenpå.',
      'Tag et blødkogt æg ved siden af. Det er de 6 gram protein, der gør, at du ikke er sulten klokken ti.'
    ],
    tip: 'Ægget er det billigste protein på hele buffeten — og det, der gør forskellen på at holde til frokost eller ej.'
  },
  {
    id: 'u-salatbar-kylling', navn: 'Salatbar med kylling og kikærter', kategori: 'frokost',
    ude: true, sted: 'Salatbaren', tid: 5, basis: 1, tags: ['ude', 'salat', 'favorit'],
    kort: 'Salatbaren er dit bedste kort på ugens travleste dage.',
    ing: [['salatmix', 200], ['kyllingebryst', 150], ['kikaerter', 150], ['cherrytomat', 100],
          ['agurk', 100], ['feta', 25], ['olie', 10]],
    fremgang: [
      'Tag proteinet først: to gode øser kylling, tun, æg eller bønner. Det er den beslutning, der afgør måltidet.',
      'Fyld resten af tallerkenen med grønt — gerne to-tre slags, så det ikke bliver kedeligt.',
      'Dressing: olie og eddike frem for de cremede. En cremet dressing kan alene være 200 kcal.',
      'Er du stadig sulten, så tag mere grønt og mere protein — ikke mere brød.'
    ],
    tip: 'Halvdelen grønt, en fjerdedel protein, en fjerdedel kulhydrat. Du behøver ikke veje noget.'
  },
  {
    id: 'u-salatbar-tun', navn: 'Salatbar med tun, æg og majs', kategori: 'frokost',
    ude: true, sted: 'Salatbaren', tid: 5, basis: 1, tags: ['ude', 'salat', 'favorit'],
    kort: 'Samme princip, anden smag — så salatbaren ikke bliver en straf.',
    ing: [['salatmix', 200], ['tun', 130], ['aeg', 2], ['majs', 60], ['agurk', 100],
          ['cherrytomat', 100], ['rodlog', 30], ['olie', 8]],
    fremgang: [
      'Tun og æg først — de fylder lidt på tallerkenen og meget i mætheden.',
      'Majs og rødløg giver sødme og bid, så det ikke smager af sundhed.',
      'Olie, eddike, salt og peber. Færdig.'
    ],
    tip: 'To æg oveni salaten er 13 g protein for 156 kcal. Det er det billigste protein på hele buffeten.'
  },
  {
    id: 'u-salatbar-plus', navn: 'Salatbar plus lidt af den varme ret', kategori: 'frokost',
    ude: true, sted: 'Kantinen', tid: 5, basis: 1, tags: ['ude', 'salat', 'favorit'],
    kort: 'Sådan ser en almindelig hverdagsfrokost ud, når rækkefølgen er rigtig.',
    ing: [['salatmix', 180], ['kyllingebryst', 120], ['kikaerter', 100], ['cherrytomat', 100],
          ['agurk', 80], ['majs', 50], ['olie', 8], ['kartofler', 100], ['hakketokse', 70]],
    fremgang: [
      'Byg salaten først, og tag proteinet fra salatbaren, før du kigger på den varme ret: kylling, tun, æg eller bønner. To øser.',
      'Fyld resten af tallerkenen med grønt, så der er mindre plads tilbage.',
      'Tag så en lille portion af den varme ret ovenpå — en tredjedel af en normal portion. Er den paneret eller cremet, så tag kun kartoflerne eller risene.',
      'Sovs ved siden af, ikke hen over. Så bestemmer du selv mængden.'
    ],
    tip: 'Rækkefølgen er hele tricket: salat først, protein næst, varm ret sidst. Du får smagen med, uden at portionen bestemmer over dig.'
  },
  {
    id: 'u-hovedret', navn: 'Halv portion af dagens varme ret + stor salat', kategori: 'frokost',
    ude: true, sted: 'Kantinen', tid: 5, basis: 1, tags: ['ude'],
    kort: 'Du behøver ikke springe den varme ret over — du skal bare fylde tallerkenen i den rigtige rækkefølge.',
    ing: [['salatmix', 150], ['cherrytomat', 80], ['agurk', 80], ['kartofler', 150],
          ['hakketokse', 110], ['olie', 6]],
    fremgang: [
      'Tag salat på tallerkenen FØRST, så der fysisk er mindre plads til resten. Det lyder som et trick, og det er det — det virker alligevel.',
      'Halv portion af den varme ret. Er den paneret, cremet eller svømmer i sovs, så tag en tredjedel og mere salat.',
      'Sovs ved siden af i stedet for hen over — så bestemmer du selv mængden.',
      'Spis salaten først. Så træffer du beslutningen om en ekstra portion, mens du allerede er halvmæt.'
    ],
    tip: 'Tallene her er et gennemsnitligt skøn for en varm ret. Er dagens ret pasta med flødesovs, så regn 300 kcal mere.'
  },
  {
    id: 'u-formiddag', navn: 'Formiddagsmad: rugbrød med ost', kategori: 'snack',
    ude: true, sted: 'Kantinen', tid: 2, basis: 1, tags: ['ude'],
    kort: 'Formiddagsmaden på de dage, hvor du skal træne — eller hvor frokosten er langt væk.',
    ing: [['rugbrod', 50], ['ost', 20], ['aeble', 1]],
    fremgang: [
      'Én skive rugbrød med ost, og et stykke frugt til.',
      'Tag den, hvis du træner senere på dagen, eller hvis der er over fem timer til frokost.',
      'Spring den over på hviledage, hvor du ikke er sulten — det er de nemmeste 250 kcal at undvære i hele ugen.'
    ],
    tip: 'Er du sulten klokken ti hver dag, er det som regel morgenmaden, der var for lille — ikke maven, der er umættelig.'
  },

  // ================= SNACKS =================
  {
    id: 's-skyrsnack', navn: 'Skyr med kanel og mandler', kategori: 'snack',
    tid: 2, basis: 1, tags: ['lyn'],
    kort: 'Standardsnacken, der kræver nul beslutninger.',
    ing: [['skyr', 150], ['mandler', 12]],
    fremgang: ['Skyr i en skål, et godt drys kanel over, mandler på.'],
    tip: 'Den bedste snack er den, der kræver nul beslutninger.'
  },
  {
    id: 's-aeg', navn: 'To kogte æg og en gulerod', kategori: 'snack',
    tid: 8, basis: 1, tags: ['forbered-forud'],
    kort: 'Køleskabets nødudgang, når sulten melder sig klokken 15.',
    ing: [['aeg', 2], ['gulerod', 100]],
    fremgang: ['Kog æggene 9 minutter og opbevar dem i køleskabet — så har du altid en nødsnack.'],
    tip: 'Kog seks ad gangen om søndagen.'
  },
  {
    id: 's-shake', navn: 'Proteinshake efter Bodypump', kategori: 'snack',
    tid: 2, basis: 1, tags: ['efter-traening'],
    kort: 'Efter Bodypump: protein og kreatin i ét glas.',
    ing: [['proteinpulver', 30], ['minimaelk', 300], ['banan', 1]],
    fremgang: [
      'Ryst proteinpulver og mælk sammen i en shaker.',
      'Tag dagens 3-5 g kreatin sammen med den — ikke fordi timingen betyder noget, men fordi det er nemt at huske.',
      'Bananen kan spises ved siden af eller blendes med.'
    ],
    tip: 'Kreatin skal tages hver dag — også på hviledage. Det står ikke på indkøbslisten, fordi det ikke er en dagligvare.'
  },
  {
    id: 's-hytteost', navn: 'Hytteost med knækbrød og peberfrugt', kategori: 'snack',
    tid: 3, basis: 1, tags: ['lyn'],
    kort: 'Salt, sprødt og mættende.',
    ing: [['hytteost', 150], ['knaekbrod', 2], ['peberfrugt', 100]],
    fremgang: ['Hytteost på knækbrød, peber over, peberfrugt i stave ved siden af.'],
    tip: 'Knækbrød + protein holder til aftensmaden. Kiks alene gør ikke.'
  },
  {
    id: 's-aeble', navn: 'Æble med peanutbutter', kategori: 'snack',
    tid: 2, basis: 1, tags: ['lyn', 'sødt'],
    kort: 'Sødt og salt på samme tid.',
    ing: [['aeble', 1], ['peanutbutter', 15]],
    fremgang: ['Skær æblet i både og dyp dem i peanutbutter.'],
    tip: 'Vej peanutbutteren op én gang, så du ved, hvor meget 15 g faktisk er.'
  },
  {
    id: 's-edamame', navn: 'Edamame med havsalt', kategori: 'snack',
    tid: 5, basis: 1, tags: ['salt', 'protein'],
    kort: 'Det tætteste du kommer på chips med 15 g protein i.',
    ing: [['edamame', 150]],
    fremgang: ['Kog edamame 4 minutter i rigeligt saltet vand og drys med flagesalt.'],
    tip: 'Det tætteste du kommer på chips med 15 g protein i.'
  },
  {
    id: 's-popcorn', navn: 'Hjemmepoppede popcorn', kategori: 'snack',
    tid: 6, basis: 1, tags: ['aftenhygge', 'volumen'],
    kort: 'En kæmpe skål, der tager en hel aften at spise.',
    ing: [['popcornkerner', 25], ['olie', 5]],
    fremgang: [
      'Varm olien i en gryde med låg, kom kernerne i og ryst gryden let.',
      'Tag den af varmen, når der går 2-3 sekunder mellem poppene. Salt over.'
    ],
    tip: 'En kæmpe skål for omkring 140 kcal. Volumen er det bedste våben mod aftentrangen.'
  },
  {
    id: 's-chokolade', navn: 'Mørk chokolade og et par mandler', kategori: 'snack',
    tid: 1, basis: 1, tags: ['sødt', 'aftenhygge'],
    kort: 'Planlagt slik. Det er derfor planen holder.',
    ing: [['chokolade', 20], ['mandler', 10]],
    fremgang: ['Bræk 20 g chokolade af, læg resten væk, og spis det langsomt sammen med mandlerne.'],
    tip: 'Planlagt slik er ikke et brud på planen — det er derfor planen holder.'
  }
];
