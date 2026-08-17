# Sådan får du synkronisering på tværs af telefon og computer

Appen virker fint uden det her — alt bliver liggende i browseren. Følger du de
fem trin, får du i stedet dine data i din egen database, så du kan registrere
træning på telefonen i motionscentret og se det på computeren bagefter.

**Tidsforbrug: cirka ti minutter.** Du skal bruge en gratis Supabase-konto.

---

## 1. Opret projektet

Gå til [supabase.com](https://supabase.com) → **Start your project** → log ind med GitHub.

Opret et nyt projekt:

| Felt | Værdi |
|---|---|
| Name | `slankemad` |
| Database Password | Lad Supabase generere en, og gem den et sikkert sted. **Appen bruger den ikke** — den er kun til, hvis du en dag vil forbinde direkte til databasen. |
| Region | **Central EU (Frankfurt)** — tættest på dig, og dine data bliver i EU. |
| Plan | Free |

Projektet er klar efter et par minutter.

## 2. Opret tabellerne

I menuen til venstre: **SQL Editor** → **New query**.

Åbn filen [`supabase/migrations/0001_skema.sql`](../supabase/migrations/0001_skema.sql)
her i repoet, kopiér **hele** indholdet, indsæt det i editoren og tryk **Run**.

Der skal stå *Success. No rows returned*. Filen kan køres igen senere uden at
ødelægge data — den opretter kun det, der ikke findes i forvejen.

Det opretter seks tabeller og slår Row Level Security til på dem alle. Det
betyder, at ingen kan læse eller skrive noget uden at være logget ind som dig.

## 3. Fortæl appen, hvor databasen ligger

I Supabase: **Project Settings** (tandhjulet) → **API**. Du skal bruge to ting:

- **Project URL** — ser ud som `https://abcdefghijkl.supabase.co`
- **anon public** under *Project API keys* — en lang tekststreng

Åbn `assets/js/data/sky-config.js` og indsæt dem:

```js
export const SKY = {
  url: 'https://abcdefghijkl.supabase.co',
  anonNoegle: 'eyJhbGciOi...'
};
```

Begge værdier er lavet til at ligge offentligt i frontend — det er sådan
Supabase er skruet sammen, og beskyttelsen ligger i reglerne fra trin 2.

Push til `main`, så deployer GitHub Actions det automatisk. Vil du hellere, så
send mig de to værdier, så lægger jeg dem ind og pusher.

## 4. Tillad login fra sitet

I Supabase: **Authentication** → **URL Configuration**.

| Felt | Værdi |
|---|---|
| Site URL | `https://qvisty.github.io/slankemad/` |
| Redirect URLs | Tilføj `https://qvisty.github.io/slankemad/` og `http://localhost:4173/` |

Uden det virker login-linket i mailen ikke — Supabase nægter at sende dig
tilbage til en adresse, den ikke kender.

## 5. Log ind

Åbn appen → **Mig** → **Synkronisering** → skriv din e-mail → **Send mig et
login-link**. Du får en mail med et engangslink. Klik på det, og du er inde —
der er ingen adgangskode at huske.

Gør det samme på telefonen. Nu deler de to enheder data.

---

## Værd at vide

**Nyeste ændring vinder.** Synkroniseringen sammenligner post for post og
beholder den nyeste. Registrerer du den samme dag forskelligt på to enheder,
uden at synkronisere imellem, overlever den seneste ændring. For én person med
to enheder er det den rigtige afvejning — men det er værd at vide.

**Gratis projekter går i dvale.** Bruger du ikke databasen i en uge, sætter
Supabase den på pause. Den vågner ved næste kald, men det første kald kan tage
et par sekunder. Du mister ingenting.

**Appen virker uden forbindelse.** Browseren er stadig arbejdskopien. Er du
offline, eller er databasen i dvale, kan du registrere som altid — det
synkroniseres, næste gang du åbner appen med forbindelse.

**Hvis du vil starte forfra:** kør SQL'en fra trin 2 igen efter at have kørt
`drop table if exists traening_saet, traening_session, gaatur, maaling, madplan, offentlig_indstillinger cascade;`.
Det sletter alt i databasen — men ikke det, der ligger i din browser.
