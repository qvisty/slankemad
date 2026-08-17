-- =====================================================================
-- Slankemad — databaseskema
--
-- Kør denne fil én gang i Supabase (SQL Editor → New query → indsæt → Run),
-- eller lad GitHub Actions køre den. Den er idempotent: den kan køres igen
-- uden at ødelægge data.
--
-- Sikkerhedsprincippet: anon-nøglen ligger offentligt i frontend — sådan er
-- den designet. Al beskyttelse ligger derfor i Row Level Security her i
-- databasen. Hver eneste tabel har RLS slået til, og hver eneste politik
-- kræver, at rækken tilhører den bruger, der er logget ind. Uden gyldigt
-- login kan der hverken læses eller skrives noget som helst.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Indstillinger og profil
-- Gemmes som ét dokument pr. bruger: det er brugerens egne valg, der altid
-- læses og skrives samlet, og som aldrig skal søges i på tværs.
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
  bruger       uuid not null references auth.users(id) on delete cascade,
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
  opdateret    timestamptz not null default now(),
  unique (bruger, dato)
);

create index if not exists traening_session_bruger_dato_idx
  on traening_session (bruger, dato desc);

-- ---------------------------------------------------------------------
-- Registrerede sæt — hører til én session
-- ---------------------------------------------------------------------
create table if not exists traening_saet (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references traening_session(id) on delete cascade,
  bruger       uuid not null references auth.users(id) on delete cascade,
  oevelse_id   text not null,
  saet_nr      smallint not null check (saet_nr >= 1 and saet_nr <= 20),
  gentagelser  integer check (gentagelser is null or (gentagelser >= 0 and gentagelser <= 500)),
  vaegt        numeric(5,1) check (vaegt is null or (vaegt >= 0 and vaegt <= 300)),
  sekunder     integer check (sekunder is null or (sekunder >= 0 and sekunder <= 3600)),
  opdateret    timestamptz not null default now(),
  unique (session_id, oevelse_id, saet_nr)
);

create index if not exists traening_saet_bruger_idx on traening_saet (bruger);

-- ---------------------------------------------------------------------
-- Gåture — registreres adskilt fra træningen med vilje
-- ---------------------------------------------------------------------
create table if not exists gaatur (
  id         uuid primary key default gen_random_uuid(),
  bruger     uuid not null references auth.users(id) on delete cascade,
  dato       date not null,
  minutter   integer not null check (minutter > 0 and minutter <= 600),
  note       text check (note is null or length(note) <= 500),
  opdateret  timestamptz not null default now(),
  unique (bruger, dato)
);

-- ---------------------------------------------------------------------
-- Målinger — vægt og taljemål
-- ---------------------------------------------------------------------
create table if not exists maaling (
  id         uuid primary key default gen_random_uuid(),
  bruger     uuid not null references auth.users(id) on delete cascade,
  dato       date not null,
  vaegt      numeric(5,1) check (vaegt is null or (vaegt >= 20 and vaegt <= 400)),
  talje      numeric(5,1) check (talje is null or (talje >= 40 and talje <= 250)),
  opdateret  timestamptz not null default now(),
  unique (bruger, dato),
  -- En måling uden tal er ikke en måling
  check (vaegt is not null or talje is not null)
);

-- ---------------------------------------------------------------------
-- Gemte madplaner
-- ---------------------------------------------------------------------
create table if not exists madplan (
  id         uuid primary key default gen_random_uuid(),
  bruger     uuid not null references auth.users(id) on delete cascade,
  navn       text not null check (length(navn) <= 120),
  plan       jsonb not null,
  aktiv      boolean not null default false,
  opdateret  timestamptz not null default now()
);

create index if not exists madplan_bruger_idx on madplan (bruger, opdateret desc);

-- =====================================================================
-- ROW LEVEL SECURITY
-- Uden det her ville anon-nøglen give hele verden adgang til alt.
-- =====================================================================

alter table offentlig_indstillinger enable row level security;
alter table traening_session        enable row level security;
alter table traening_saet           enable row level security;
alter table gaatur                  enable row level security;
alter table maaling                 enable row level security;
alter table madplan                 enable row level security;

-- Én politik pr. tabel, der dækker alle fire handlinger. `using` styrer, hvilke
-- rækker der kan læses og ændres; `with check` forhindrer, at man skriver en
-- række, der tilhører en anden bruger.
do $$
declare
  t text;
begin
  foreach t in array array[
    'offentlig_indstillinger', 'traening_session', 'traening_saet',
    'gaatur', 'maaling', 'madplan'
  ] loop
    execute format('drop policy if exists egne_raekker on %I', t);
    execute format(
      'create policy egne_raekker on %I
         for all
         to authenticated
         using (bruger = (select auth.uid()))
         with check (bruger = (select auth.uid()))', t);
  end loop;
end $$;

-- Anonyme besøgende har ingen adgang overhovedet. Det er standard, når RLS er
-- slået til og der ikke findes en politik for rollen `anon` — men vi siger det
-- eksplicit, så det ikke kan blive slået til ved et uheld senere.
revoke all on offentlig_indstillinger, traening_session, traening_saet,
              gaatur, maaling, madplan from anon;

-- =====================================================================
-- `opdateret` skal altid være sand, også når klienten glemmer den.
-- Det er den, synkroniseringen bruger til at afgøre, hvad der er nyest.
-- =====================================================================
create or replace function saet_opdateret()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.opdateret := now();
  return new;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'offentlig_indstillinger', 'traening_session', 'traening_saet',
    'gaatur', 'maaling', 'madplan'
  ] loop
    execute format('drop trigger if exists opdateret_trigger on %I', t);
    execute format(
      'create trigger opdateret_trigger before insert or update on %I
         for each row execute function saet_opdateret()', t);
  end loop;
end $$;
