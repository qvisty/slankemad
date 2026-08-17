-- =====================================================================
-- Slankemad — databaseskema
--
-- Kør denne fil én gang i Supabase (SQL Editor → New query → indsæt → Run),
-- eller kør den igen efter en opdatering. Den er idempotent: den opretter kun
-- det, der mangler, og ændrer kun det, der skal ændres.
--
-- Tre principper styrer skemaet:
--
--  1. **Al beskyttelse ligger i Row Level Security.** anon-nøglen ligger
--     offentligt i frontend — sådan er den designet. Hver tabel har RLS slået
--     til, og hver politik kræver, at rækken tilhører den bruger, der er logget
--     ind. Uden gyldigt login kan der hverken læses eller skrives noget.
--  2. **Klientens `opdateret` er sandheden.** Synkroniseringen er "nyeste
--     ÆNDRING vinder". Ville databasen selv stemple ved hver skrivning, blev
--     det i stedet "sidst SYNKRONISERET vinder" — og så taber den enhed, der
--     rettede sidst, men kom online først. Triggeren nedenfor bevarer derfor
--     klientens stempel og retter kun urimelige værdier.
--  3. **Sletning er en ændring, ikke et fravær.** En slettet post får
--     `slettet` sat i stedet for at forsvinde. Uden det ville en post, der er
--     slettet på én enhed, blive hentet tilbage fra serveren ved næste
--     synkronisering — for den anden enhed kan ikke se forskel på "slettet"
--     og "har aldrig eksisteret".
-- =====================================================================

-- ---------------------------------------------------------------------
-- Indstillinger og profil
-- Gemmes som ét dokument pr. bruger, opdelt i navngivne dele med hver sit
-- tidsstempel (se `sky.js`), så to enheder kan rette hver sin del uden at
-- overskrive hinanden.
-- ---------------------------------------------------------------------
create table if not exists offentlig_indstillinger (
  bruger      uuid primary key references auth.users(id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  opdateret   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Træningssessioner — én pr. dag, der er rørt ved
-- `snapshot` er øjebliksbilledet af skabelonen, som den så ud, da træningen
-- blev gennemført. Det er dét, historikken viser — derfor ligger det på
-- rækken og ikke i en opslagstabel, der kan ændre sig bagefter.
-- ---------------------------------------------------------------------
create table if not exists traening_session (
  id           uuid primary key default gen_random_uuid(),
  bruger       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dato         date not null,
  skabelon_id  text,
  status       text not null default 'planlagt'
               check (status in ('planlagt', 'igang', 'gennemfoert', 'sprunget')),
  startet      timestamptz,
  sluttet      timestamptz,
  varighed     integer check (varighed is null or (varighed >= 0 and varighed <= 600)),
  intensitet   text check (intensitet is null or intensitet in ('let', 'moderat', 'haard')),
  intervaller  integer check (intervaller is null or (intervaller >= 0 and intervaller <= 60)),
  note         text check (note is null or length(note) <= 500),
  vaegte       jsonb not null default '{}'::jsonb,
  snapshot     jsonb,
  slettet      timestamptz,
  opdateret    timestamptz not null default now(),
  unique (bruger, dato),
  -- Målet for den sammensatte fremmednøgle fra traening_saet nedenfor.
  unique (id, bruger)
);

create index if not exists traening_session_bruger_dato_idx
  on traening_session (bruger, dato desc);

-- ---------------------------------------------------------------------
-- Registrerede sæt — hører til én session
--
-- Fremmednøglen er sammensat af (session_id, bruger). Uden `bruger` i nøglen
-- kunne enhver logget bruger hænge sine egne sæt på en fremmed session:
-- politikken ser kun på `bruger`-kolonnen og ville sige god for det. Værre
-- endnu ville det låse ejerens synkronisering permanent, fordi ejeren hverken
-- kan se eller rette den fremmede række, men stadig kolliderer med den.
-- ---------------------------------------------------------------------
create table if not exists traening_saet (
  id           uuid primary key default gen_random_uuid(),
  bruger       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id   uuid not null,
  oevelse_id   text not null,
  saet_nr      smallint not null check (saet_nr >= 1 and saet_nr <= 20),
  gentagelser  integer check (gentagelser is null or (gentagelser >= 0 and gentagelser <= 500)),
  vaegt        numeric(5,1) check (vaegt is null or (vaegt >= 0 and vaegt <= 300)),
  sekunder     integer check (sekunder is null or (sekunder >= 0 and sekunder <= 3600)),
  slettet      timestamptz,
  opdateret    timestamptz not null default now(),
  unique (session_id, oevelse_id, saet_nr),
  constraint traening_saet_session_bruger_fk
    foreign key (session_id, bruger)
    references traening_session (id, bruger) on delete cascade
);

create index if not exists traening_saet_bruger_idx on traening_saet (bruger);

-- ---------------------------------------------------------------------
-- Gåture — registreres adskilt fra træningen med vilje
-- ---------------------------------------------------------------------
create table if not exists gaatur (
  id         uuid primary key default gen_random_uuid(),
  bruger     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dato       date not null,
  minutter   integer check (minutter is null or (minutter > 0 and minutter <= 600)),
  note       text check (note is null or length(note) <= 500),
  slettet    timestamptz,
  opdateret  timestamptz not null default now(),
  unique (bruger, dato),
  -- En gåtur uden minutter giver kun mening som gravsten
  check (slettet is not null or minutter is not null)
);

-- ---------------------------------------------------------------------
-- Målinger — vægt og taljemål
-- ---------------------------------------------------------------------
create table if not exists maaling (
  id         uuid primary key default gen_random_uuid(),
  bruger     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dato       date not null,
  vaegt      numeric(5,1) check (vaegt is null or (vaegt >= 20 and vaegt <= 400)),
  talje      numeric(5,1) check (talje is null or (talje >= 40 and talje <= 250)),
  slettet    timestamptz,
  opdateret  timestamptz not null default now(),
  unique (bruger, dato),
  -- En måling uden tal er ikke en måling — medmindre den er slettet
  check (slettet is not null or vaegt is not null or talje is not null)
);

-- Gemte madplaner ligger i indstillingsdokumentet, ikke i en egen tabel. En
-- tabel, ingen skriver til, er en, ingen holder øje med.
drop table if exists madplan;

-- =====================================================================
-- OPGRADERING af en database, der blev oprettet med en tidligere udgave.
-- Springes over på en frisk database, hvor alt allerede står rigtigt.
-- =====================================================================
do $$
begin
  -- Gravsten
  alter table traening_session add column if not exists slettet timestamptz;
  alter table traening_saet    add column if not exists slettet timestamptz;
  alter table gaatur           add column if not exists slettet timestamptz;
  alter table maaling          add column if not exists slettet timestamptz;

  -- `bruger` udfyldes af databasen, så klienten ikke kan komme til at tage fejl
  alter table traening_session alter column bruger set default auth.uid();
  alter table traening_saet    alter column bruger set default auth.uid();
  alter table gaatur           alter column bruger set default auth.uid();
  alter table maaling          alter column bruger set default auth.uid();

  -- Gåture og målinger må være tomme, når de er gravsten
  alter table gaatur  alter column minutter drop not null;
  begin
    alter table gaatur drop constraint if exists gaatur_check;
    alter table gaatur add constraint gaatur_har_indhold
      check (slettet is not null or minutter is not null);
  exception when duplicate_object then null;
  end;
  begin
    alter table maaling drop constraint if exists maaling_check;
    alter table maaling add constraint maaling_har_indhold
      check (slettet is not null or vaegt is not null or talje is not null);
  exception when duplicate_object then null;
  end;

  -- Målet for den sammensatte fremmednøgle. Uden den kan nøglen ikke oprettes.
  if not exists (
    select 1 from pg_constraint c
     where c.conrelid = 'traening_session'::regclass
       and c.contype in ('u', 'p')
       and (select array_agg(a.attname::text order by a.attname::text)
              from unnest(c.conkey) k
              join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k)
           = array['bruger', 'id']
  ) then
    alter table traening_session add constraint traening_session_id_bruger_key unique (id, bruger);
  end if;

  -- Sammensat fremmednøgle på sæt — findes den allerede med begge kolonner, er
  -- der intet at gøre. (Navnet alene er ikke nok: den kan hedde noget andet.)
  if not exists (
    select 1 from pg_constraint c
     where c.conrelid = 'traening_saet'::regclass
       and c.contype = 'f'
       and c.confrelid = 'traening_session'::regclass
       and (select array_agg(a.attname::text order by a.attname::text)
              from unnest(c.conkey) k
              join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k)
           = array['bruger', 'session_id']
  ) then
    delete from traening_saet s
     where not exists (select 1 from traening_session t
                        where t.id = s.session_id and t.bruger = s.bruger);
    alter table traening_saet drop constraint if exists traening_saet_session_id_fkey;
    alter table traening_saet add constraint traening_saet_session_bruger_fk
      foreign key (session_id, bruger)
      references traening_session (id, bruger) on delete cascade;
  end if;
end $$;

-- Loft over de felter, der ikke har et naturligt maksimum. Uden det kan en
-- hvilken som helst konto skrive gigabytes og vælte projektet på lagerkvoten.
do $$
begin
  alter table offentlig_indstillinger add constraint indstillinger_stoerrelse
    check (pg_column_size(data) <= 400000);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table traening_session add constraint session_stoerrelse
    check (pg_column_size(snapshot) <= 100000 and pg_column_size(vaegte) <= 20000);
exception when duplicate_object then null;
end $$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- Uden det her ville anon-nøglen give hele verden adgang til alt.
-- =====================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'offentlig_indstillinger', 'traening_session', 'traening_saet', 'gaatur', 'maaling'
  ] loop
    execute format('alter table %I enable row level security', t);
    -- `force` gælder også tabellens ejer. Det rammer ikke browseren, men det
    -- lukker alt, der en dag måtte køre som ejeren.
    execute format('alter table %I force row level security', t);

    -- Én politik pr. tabel, der dækker alle fire handlinger. `using` styrer,
    -- hvilke rækker der kan læses og ændres; `with check` forhindrer, at man
    -- skriver en række, der tilhører en anden bruger.
    execute format('drop policy if exists egne_raekker on %I', t);
    execute format(
      'create policy egne_raekker on %I
         for all
         to authenticated
         using (bruger = (select auth.uid()))
         with check (bruger = (select auth.uid()))', t);

    -- Anonyme besøgende har ingen adgang overhovedet. Det er standard, når RLS
    -- er slået til uden en politik for rollen `anon` — men vi siger det
    -- eksplicit, så det ikke kan blive slået til ved et uheld senere.
    execute format('revoke all on %I from anon', t);
  end loop;
end $$;

-- Og næste tabel, nogen opretter her, arver ikke anon-rettigheder fra Supabase'
-- standardindstillinger.
alter default privileges in schema public revoke all on tables from anon;

-- =====================================================================
-- `opdateret` — klientens stempel gælder
--
-- Klienten sætter `opdateret` til det tidspunkt, ÆNDRINGEN skete. Det er dét,
-- flettelogikken sammenligner. Triggeren udfylder derfor kun, når klienten
-- ikke selv sendte et stempel, og skærer ure, der går for meget forud.
-- =====================================================================
create or replace function saet_opdateret()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.opdateret := least(coalesce(new.opdateret, now()), now() + interval '5 minutes');
  return new;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'offentlig_indstillinger', 'traening_session', 'traening_saet', 'gaatur', 'maaling'
  ] loop
    execute format('drop trigger if exists opdateret_trigger on %I', t);
    execute format(
      'create trigger opdateret_trigger before insert or update on %I
         for each row execute function saet_opdateret()', t);
  end loop;
end $$;
