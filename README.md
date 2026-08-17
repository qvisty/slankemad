# Slankemad

**Madplan og indkøbsliste til fedttab — med styrketræning, ikke i stedet for den.**

En lille, hurtig webapp der hver uge laver en madplan og en samlet indkøbsliste
til REMA 1000. Den er bygget til ét bestemt formål: at tabe kropsfedt (og dermed
også mavefedt) uden at tabe muskelmasse, mens man træner BodyPump og tager
kreatin — og uden at det føles som en kur.

👉 **[Åbn appen](https://qvisty.github.io/slankemad/)** ·
📈 **[Udviklingsstatus](https://qvisty.github.io/slankemad/progress.html)**

---

## Hvad den gør

| | |
|---|---|
| **Madplan** | 3-7 dage med morgenmad, frokost, aftensmad og snacks. Byt en enkelt ret, lav en enkelt dag om, eller lav hele ugen om. Favoritter vægtes tungere næste gang. Planer kan gemmes og hentes frem igen. |
| **Opskrifter** | 57 retter med ingredienser, mængder skaleret til antal personer, tilberedningstid, fremgangsmåde og fuld næring pr. portion. Mærkater som *hurtig*, *proteinrig*, *billig*, *god træningsdag* og *god hviledag* beregnes af koden — de kan ikke komme i utakt med tallene. |
| **Indkøbsliste** | Alle råvarer fra planen lagt sammen på tværs af retter og sorteret efter afdeling i butikken. Kan grupperes efter ret i stedet, krydses af undervejs, kopieres og printes. |
| **Dagsrytme** | Sæt dine spisetider, så snacks lægges i dagens længste hul i stedet for lige før et måltid — og se om et mellemmåltid på formiddagen overhovedet gør gavn. |
| **Måltider du får serveret** | Får du morgenmad og frokost i kantinen eller ved en salatbar i hverdagen, så slå det til under Mig (det er slået til som standard). Planen lægger så kun aftensmad og weekend ind, og de serverede måltider tæller stadig med i kalorier og makroer — men kommer aldrig på indkøbslisten. |
| **Råvaregenbrug** | Generatoren belønner retter, der bruger råvarer, ugen allerede har åbnet, og straffer en ny fersk pakke, hvor halvdelen bliver til rest. Færre varer, mindre madspild. |
| **Oversigt** | Gennemsnitlige kalorier og makroer pr. dag, antal måltider, tid i køkkenet, fordeling af hurtige vs. længere retter og status på fedttabet. |
| **Fremskridt** | Log vægt og taljemål. Taljen får sin egen graf, fordi kreatin binder vand og gør vægten upålidelig de første uger. |

Appen kører 100 % i browseren. Ingen konto, ingen server, ingen data der forlader
din maskine — alt gemmes i `localStorage`.

## Ernæringsprincipperne

Der er ikke noget hokuspokus i modellen, og der er ingen øvelser eller fødevarer,
der brænder fedt netop på maven. Det, appen faktisk gør:

- **Moderat underskud.** Basalstofskifte efter Mifflin-St Jeor, ganget med
  aktivitetsniveau, plus ca. 350 kcal pr. BodyPump-time. Underskuddet begrænses
  altid til højst 25 % af det samlede forbrug, og der advares, hvis tempoet
  overstiger 0,7 % af kropsvægten om ugen.
- **Højt protein.** 2,0 g pr. kg målvægt, fordelt over dagen. Det regnes af
  målvægten og ikke af den vægt du har nu, fordi fedtvæv ikke har et
  proteinbehov. Protein er den ene faktor, der sammen med styrketræning afgør,
  om vægttabet kommer fra fedt eller fra muskler.
- **Fedtgulv.** Mindst 0,8 g pr. kg, resten som kulhydrat.
- **Trænings- og hviledage.** Træningsdage får op til 250 kcal ekstra, hviledage
  tilsvarende færre, og kulhydraterne bærer forskellen. Ugegennemsnittet er
  uændret, og en hviledag kan aldrig falde under dit basalstofskifte.
- **Buffet-måltider er skøn, ikke opskrifter.** Et kantinemåltid regnes ud fra en normal portion — skyr, salatbar, halv varm ret — og kan ikke skaleres frit, fordi du tager, hvad du tager. Tallene er gode nok til at få ugen til at hænge sammen, ikke til at måle med.
- **Mæthed frem for moral.** Hvert måltid er bygget om en proteinkilde og en stor
  mængde grønt, fordi protein og fibre er det, der mætter pr. kalorie.
- **En fri aften om ugen** og en planlagt sød snack er indbygget med vilje. Kure,
  der forbyder alt, holder i tre uger.

## Data, kilder og hvad appen ikke påstår

- **Ingen priser.** Der findes ingen åben, kontrollerbar priskilde for REMA 1000's
  aktuelle priser og tilbud, som en statisk side kan hente fra. Derfor viser appen
  ingen kronebeløb — kun mængder og pakkestørrelser. En vurderet prisklasse (1-3)
  bruges internt til *billig*-mærkatet og er ikke en pris.
- **Pakkestørrelser** følger REMA 1000's typiske sortiment, verificeret mod et
  tredjeparts-varedump af `shop.rema1000.dk` (august 2026). Enkelte varer er
  markeret med et alternativ, fordi de ikke altid føres — fx sriracha,
  proteinpulver og kreatin, som ikke er dagligvarer.
- **Næringstal** er runde tal på niveau med varedeklarationer for almindelige
  danske dagligvarer. De er gode nok til at planlægge efter, ikke til at måle med.
- Appen er et planlægningsværktøj, **ikke sundhedsfaglig rådgivning**.

## Arkitektur

Ingen build, ingen afhængigheder, ingen framework. Ren ES-moduler, som browseren
selv indlæser — derfor er der intet at bygge, og siden kan serveres som den er.

```
index.html            App-skal
progress.html         Live udviklingsstatus
assets/css/app.css    Designsystem (tokens, komponenter, mørk tilstand, print)
assets/js/
  app.js              Navigation og gentegning
  data/varer.js       Varekatalog: næring, afdeling, pakkestørrelse
  data/opskrifter.js  Opskrifter — kender kun varenøgler og mængder
  data/guide.js       Guidetekster
  core/state.js       Brugerindstillinger og persistens (localStorage)
  core/ernaering.js   Næring pr. opskrift + daglige mål
  core/plan.js        Plangeneratoren
  core/indkob.js      Sammenlægning og gruppering af indkøb
  ui/                 Én fil pr. skærm + delte komponenter
```

Lagene kender kun hinanden nedad. Et opskriftskort ved intet om, hvor
næringstallene kommer fra, og `core/` ved intet om DOM. Skal varekataloget en dag
komme fra et API, er det `data/varer.js` og `core/state.js`, der skiftes ud — ikke
skærmene.

**Madbillederne** er genereret SVG, tegnet ud fra rettens egne råvarer. Ingen
eksterne billeder, ingen rettighedsproblemer, ingen ventetid på et CDN — og samme
ret giver altid det samme billede.

## Kør lokalt

```bash
git clone https://github.com/qvisty/slankemad.git
cd slankemad
python3 -m http.server 4173   # ES-moduler kræver http, ikke file://
```

Åbn <http://localhost:4173>.

## Deployment

`main` er produktionskilden. Hvert push til `main` kører
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), som
syntakstjekker alle JavaScript-moduler og derefter deployer sitet til GitHub
Pages. Ingen manuelle trin.

## Metode

Produktet er bygget i små dele, hvor hver del er blevet kritiseret af en frisk
kritiker uden adgang til begrundelserne bag den, og derefter bygget om. Metoden er
en tilpasning af **Claude Gauntlet-koden**:

> <https://github.com/robonuggets/gauntlet-loop/blob/main/.claude/skills/gauntlet-loop/SKILL.md>

Kernen i den: fastlæg en konkret, hentbar målestok i stedet for en beskrivelse af
kvalitet, del arbejdet i de mindste dele der kan bedømmes hver for sig, lad en
kritiker sammenligne blindt mod målestokken, og fortsæt til kritikeren vælger
vores. Målestokken her har været de faktiske interfaces fra Lifesum, Yazio,
Mealime og Eat This Much.

Undervejs er status ført på [progress.html](progress.html).

## Licens

Til privat brug. Opskrifter og tekster er skrevet til dette projekt.
