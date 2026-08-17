# Sådan får du synkronisering på tværs af telefon og computer

Appen virker fint uden det her — alt bliver liggende i browseren. Følger du de
seks trin, får du i stedet dine data i din egen database, så du kan registrere
træning på telefonen i motionscentret og se det på computeren bagefter.

**Tidsforbrug: cirka et kvarter.** Du skal bruge en gratis Supabase-konto.

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
ødelægge data — den opretter kun det, der mangler.

Det opretter fem tabeller og slår Row Level Security til på dem alle. Det
betyder, at ingen kan læse eller skrive noget uden at være logget ind som dig.

## 3. Opret din bruger — én gang, i hånden

**Authentication** → **Users** → **Add user** → **Create new user**. Skriv din
e-mail, sæt flueben i *Auto Confirm User*, og lad adgangskoden være ligegyldig —
du kommer aldrig til at bruge den.

Gå derefter til **Authentication** → **Sign In / Providers** og **slå "Allow new
users to sign up" fra**.

Det her trin er ikke pynt. Endpointet, der sender login-mails, kan kaldes af
hvem som helst med den offentlige nøgle. Med oprettelse slået til kunne en
fremmed sende login-mails fra dit projekt til vilkårlige adresser og brænde din
mailkvote af, så du selv ikke kunne komme ind. Med oprettelse slået fra findes
der præcis én konto: din.

Mens du er der: **Authentication** → **Rate Limits** → sæt *Rate limit for
sending emails* ned til fx 4 i timen. Du skal bruge ét login-link pr. enhed, ikke
tredive.

## 4. Fortæl appen, hvor databasen ligger

I Supabase: **Project Settings** (tandhjulet) → **API**. Du skal bruge to ting:

- **Project URL** — ser ud som `https://abcdefghijkl.supabase.co`
- **anon public** under *Project API keys* — en lang tekststreng

> Pas på ikke at tage `service_role` ved et uheld — den ligger lige ved siden af
> og ser ens ud, men den omgår al beskyttelse. Appen tjekker selv nøglens rolle
> og nægter at bruge den forkerte, men den skal alligevel ikke ligge i et
> offentligt repo.

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

## 5. Tillad login fra sitet

I Supabase: **Authentication** → **URL Configuration**.

| Felt | Værdi |
|---|---|
| Site URL | `https://qvisty.github.io/slankemad/` |
| Redirect URLs | `https://qvisty.github.io/slankemad/**` og `http://localhost:4173/**` |

De to stjerner er nødvendige: appen sender en engangskode med i adressen, så den
kan se, at det er DEN her enhed, der bad om linket. Uden dem afviser Supabase
returadressen.

## 6. Log ind

Åbn appen → **Mig** → **Synkronisering** → skriv din e-mail → **Send mig et
login-link**. Du får en mail med et engangslink. Klik på det, og du er inde —
der er ingen adgangskode at huske.

Gør det samme på telefonen. Åbner du mailen på en anden enhed end den, der bad
om linket, spørger appen én gang, om kontoen er din, før den sender noget. Sig
ja, og de to enheder deler data.

---

## Værd at vide

**Nyeste ændring vinder — post for post.** To enheder kan roligt registrere hver
sin ting. Retter I begge *den samme* måling eller den samme dags træning uden at
synkronisere imellem, overlever den, der blev rettet sidst. Ikke den, der
synkroniserede sidst — det er forskellen, og det er den, der gør, at man ikke
mister noget ved at komme sent online.

**Sletning bliver ved med at være sletning.** Fjerner du en måling eller en
gåtur, efterlader appen en usynlig markering, så den også forsvinder på den
anden enhed. Ellers ville den blive hentet tilbage ved næste synkronisering.

**Indstillinger flettes hver for sig.** Laver du en madplan på telefonen og
retter målvægten på computeren, overlever begge dele. Kun hvis I retter præcis
den samme ting begge steder, vinder den ene — og så står det i beskeden.

**Gratis projekter går i dvale.** Bruger du ikke databasen i en uge, sætter
Supabase den på pause. Den vågner ved næste kald, men det første kald kan tage
et par sekunder. Du mister ingenting.

**Appen virker uden forbindelse.** Browseren er stadig arbejdskopien. Er du
offline, eller er databasen i dvale, kan du registrere som altid — det
synkroniseres, næste gang du åbner appen med forbindelse.

**"Nulstil alt" rammer også databasen,** når du er logget ind. Det står i
bekræftelsen. Har du en anden enhed, der ikke har synkroniseret siden, sender
den sine data op igen næste gang — nulstil den også, hvis du vil starte helt
forfra.

**Hvis du vil starte forfra i databasen:** kør SQL'en fra trin 2 igen efter at
have kørt
`drop table if exists traening_saet, traening_session, gaatur, maaling, offentlig_indstillinger cascade;`.
Det sletter alt i databasen — men ikke det, der ligger i din browser.
