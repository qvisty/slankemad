# Loop-prompt (dansk)

En forbedret udgave af [gauntlet-loop](https://github.com/robonuggets/gauntlet-loop/blob/main/.claude/skills/gauntlet-loop/SKILL.md),
skrevet efter erfaringerne fra dette projekt.

**Det, der ændrede sig i forhold til originalen:**

1. **Målestokken skal skaffes, ikke antages.** Kan referencen ikke hentes, skal
   agenten sige det højt og bede om artefakter — ikke lade som om, den
   sammenligner blindt mod noget, den kun har læst en beskrivelse af.
2. **Exit-betingelsen er skiftet ud.** "Loop indtil kritikeren vælger vores" er
   ikke falsificerbar, når kritikeren ikke kan se referencen — og en kritiker,
   der har fået besked på aldrig at rose, finder altid noget. Nu stopper hver del,
   når den største tilbageværende forskel er noget, vi *bevidst* fravælger — og
   fravalget skal skrives ned.
3. **To slags kritik, ikke én.** Smagskritik (ser det rigtigt ud?) og
   korrekthedskritik (regner det rigtigt?) kræver forskellige metoder. Den anden
   skal køre koden, ikke læse den.
4. **Forbud mod opdigtede data.** Den regel reddede dette projekt: research viste,
   at der ikke fandtes en kontrollerbar priskilde, og så røg alle priser ud i
   stedet for at blive gættet.
5. **Loft på runder og en pligt til at rapportere fravalg.** Ellers poleres det
   forkerte i det uendelige.

---

## Prompten

```
Byg [MÅL].

## Målestok

Målestokken er [REFERENCE — navngivet produkt, artefakt eller fil, ikke en kategori].

Skaf den rigtige reference, før du designer noget. Hvis du ikke kan hente den —
netværksblokering, login, betalingsmur — så stop og sig det direkte, og bed mig om
det, du mangler (screenshots, en fil, et link). Sammenlign aldrig mod en
beskrivelse af referencen, mens du kalder det en sammenligning. Skriv altid
eksplicit, om en påstand bygger på noget, du faktisk har set, eller på en
vurdering.

## Regler for data

Opdigt aldrig tal, priser, citater eller kilder. Kan et tal ikke efterprøves, så
udelad det og skriv hvorfor. Et manglende tal er bedre end et forkert.

## Arbejdsform

Del arbejdet i de mindste dele, der giver mening at bedømme hver for sig. Skriv
listen ned, før du går i gang.

For hver del:

1. **Builder** bygger delen færdig — ikke en skitse.
2. **Kritiker med frisk kontekst** vurderer resultatet. Kritikeren får ikke
   builderens begrundelser, kun det færdige output. Ros er ubrugelig.
   Kritikeren skal:
   - inspicere det faktiske output: se den renderede side, køre koden, læse de
     tal den producerer — ikke gætte ud fra kildekoden
   - lægge det ved siden af målestokken uden mærkater og sige, hvilket der er
     bedst, og hvorfor
   - udpege **den ene største tilbageværende forskel**, konkret nok til at
     handle på
3. **Builder retter** og skriver, hvad der blev ændret.

Kør to slags kritik, hvor det giver mening:
- **Smag og form:** ser det rigtigt ud? Skærmbilleder i de faktiske
  skærmstørrelser, både lys og mørk tilstand.
- **Korrekthed:** regner det rigtigt? Kritikeren skal køre koden på rigtige data
  og efterregne resultaterne, ikke vurdere dem på udseendet.

## Hvornår en del er færdig

En del er færdig, når kritikerens største tilbageværende forskel er noget, vi
bevidst fravælger — og fravalget står skrevet ned med en begrundelse. Ikke når
alt er perfekt.

Maks [3] runder pr. del. Er delen ikke i mål efter det, så stop, skriv hvad der
mangler, og gå videre. Sig til, hvis en del viser sig at være vigtigere end
antaget.

## Beslutninger

Træf rimelige beslutninger selv i stedet for at spørge om småting — men skriv
dem ned, når de ændrer produktet. Spørg kun, hvis et forkert valg ville spilde
arbejdet.

## Live status

Opret en statusside i projektet fra starten, og opdater den undervejs — ikke til
sidst. Den skal vise: del, status, runde, seneste kritik, hvad der blev ændret,
bestået/ikke bestået, næste skridt og bevidste fravalg.

## Rapportering

Når du er færdig, så skriv:
- hvad der blev bygget
- hvad der blev fravalgt, og hvorfor
- hvad du ikke kunne efterprøve
- den største tilbageværende svaghed i det, du afleverer

[Fan arbejdet ud til subagenter, hvor det forbedrer kvaliteten.]
[Brug ultracode.]
```

---

## Sådan bruger du den

- **[REFERENCE]** skal bestå tre prøver: den er *navngivet* (et bestemt produkt,
  ikke "moderne apps"), den kan *hentes*, og den kan *stilles ved siden af* dit
  resultat. "Lifesums dashboard-skærm" duer. "God UX" duer ikke.
- Har du screenshots af referencen, så vedhæft dem i første besked. Det er
  forskellen på en rigtig blind sammenligning og en simuleret.
- De to sidste linjer i klammer fjerner du, hvis opgaven er lille. Fan-out og
  ultracode koster meget, og på små opgaver bliver kvaliteten ikke bedre af det.
- Sæt rundeloftet efter, hvor meget du gider vente. 3 runder pr. del rammer
  typisk 90 % af værdien.
