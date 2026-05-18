-- =============================================================
-- CarLink — Schéma complet de la base de données
-- PostgreSQL / Supabase
-- Aligné sur la spec "Architecture du projet" (directeur technique)
-- À exécuter dans : Supabase Dashboard → SQL Editor → New query
-- =============================================================

create extension if not exists "uuid-ossp";

-- =============================================================
-- ENUMS
-- =============================================================
create type user_role      as enum ('conductor', 'garage', 'admin');
create type app_language    as enum ('fr', 'en');
create type request_urgency as enum ('low', 'medium', 'high');
create type request_status  as enum ('pending', 'quoted', 'accepted', 'in_progress', 'completed', 'declined');
create type payment_status  as enum ('pending', 'paid');

-- =============================================================
-- 1. USERS  (extension de auth.users)
--    L'auth (téléphone/email) est gérée par Supabase Auth.
--    Cette table porte le profil applicatif.
-- =============================================================
create table public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  phone      text unique,
  email      text unique,
  full_name  text,
  role       user_role not null default 'conductor',
  city       text,
  language   app_language not null default 'fr',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- 2. VEHICLES
-- =============================================================
create table public.vehicles (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  brand         text not null,
  model         text not null,
  year          int,
  license_plate text unique,
  mileage       int,
  fuel_type     text,
  color         text,
  created_at    timestamptz not null default now()
);
create index vehicles_user_idx on public.vehicles(user_id);

-- =============================================================
-- 3. GARAGES
-- =============================================================
create table public.garages (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references public.users(id) on delete cascade,
  garage_name        text not null,
  city               text,
  neighborhood       text,
  latitude           double precision,
  longitude          double precision,
  phone              text,
  specialties        text[] not null default '{}',
  rating             numeric(2,1) not null default 0,
  review_count       int not null default 0,
  is_certified       boolean not null default false,
  suspended          boolean not null default false,
  documents_verified boolean not null default false,
  response_time_avg  int,                       -- minutes
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index garages_user_idx      on public.garages(user_id);
create index garages_city_idx      on public.garages(city);
create index garages_suspended_idx on public.garages(suspended);
create index garages_geo_idx       on public.garages(latitude, longitude);

-- =============================================================
-- 4. QUOTE_REQUESTS
-- =============================================================
create table public.quote_requests (
  id           uuid primary key default uuid_generate_v4(),
  conductor_id uuid not null references public.users(id) on delete cascade,
  garage_id    uuid references public.garages(id) on delete set null,
  vehicle_id   uuid references public.vehicles(id) on delete set null,
  service_type text not null,
  description  text,
  images_urls  text[] not null default '{}',
  urgency      request_urgency not null default 'medium',
  status       request_status  not null default 'pending',
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  completed_at timestamptz
);
create index quote_requests_conductor_idx on public.quote_requests(conductor_id);
create index quote_requests_garage_idx    on public.quote_requests(garage_id);
create index quote_requests_status_idx    on public.quote_requests(status);

-- =============================================================
-- 5. QUOTES
-- =============================================================
create table public.quotes (
  id               uuid primary key default uuid_generate_v4(),
  request_id       uuid not null references public.quote_requests(id) on delete cascade,
  garage_id        uuid not null references public.garages(id) on delete cascade,
  diagnostic_price numeric(12,2) not null default 0,
  parts_price      numeric(12,2) not null default 0,
  labor_price      numeric(12,2) not null default 0,
  total_price      numeric(12,2) not null default 0,
  estimated_days   int,
  warranty         text,
  notes            text,
  created_at       timestamptz not null default now(),
  unique (request_id, garage_id)
);
create index quotes_request_idx on public.quotes(request_id);
create index quotes_garage_idx  on public.quotes(garage_id);

-- =============================================================
-- 6. MESSAGES  (chat temps réel, attaché à une demande)
-- =============================================================
create table public.messages (
  id           uuid primary key default uuid_generate_v4(),
  request_id   uuid not null references public.quote_requests(id) on delete cascade,
  sender_id    uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  content      text,
  images_urls  text[] not null default '{}',
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);
create index messages_request_idx   on public.messages(request_id);
create index messages_recipient_idx on public.messages(recipient_id);

-- =============================================================
-- 7. REVIEWS  (avis vérifiés, 6 critères)
-- =============================================================
create table public.reviews (
  id                   uuid primary key default uuid_generate_v4(),
  request_id           uuid not null references public.quote_requests(id) on delete cascade,
  garage_id            uuid not null references public.garages(id) on delete cascade,
  conductor_id         uuid not null references public.users(id) on delete cascade,
  rating               int not null check (rating between 1 and 5),
  quality_rating       int check (quality_rating between 1 and 5),
  transparency_rating  int check (transparency_rating between 1 and 5),
  timing_rating        int check (timing_rating between 1 and 5),
  communication_rating int check (communication_rating between 1 and 5),
  price_rating         int check (price_rating between 1 and 5),
  comment              text,
  approved             boolean not null default true,
  flagged              boolean not null default false,
  created_at           timestamptz not null default now(),
  unique (request_id)
);
create index reviews_garage_idx   on public.reviews(garage_id);
create index reviews_flagged_idx  on public.reviews(flagged);

-- =============================================================
-- 8. INVOICES
-- =============================================================
create table public.invoices (
  id             uuid primary key default uuid_generate_v4(),
  request_id     uuid not null references public.quote_requests(id) on delete cascade,
  garage_id      uuid not null references public.garages(id) on delete cascade,
  amount         numeric(12,2) not null,
  payment_status payment_status not null default 'pending',
  payment_date   timestamptz,
  created_at     timestamptz not null default now()
);
create index invoices_request_idx on public.invoices(request_id);
create index invoices_garage_idx  on public.invoices(garage_id);

-- =============================================================
-- 9. NOTIFICATIONS  (in-app + Expo Push — section 7 archi)
-- =============================================================
create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  title      text not null,
  body       text,
  data       jsonb not null default '{}',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id);

-- =============================================================
-- FONCTIONS & TRIGGERS
-- =============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger trg_users_updated   before update on public.users    for each row execute function public.set_updated_at();
create trigger trg_garages_updated  before update on public.garages  for each row execute function public.set_updated_at();

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, phone, email, full_name, role, language)
  values (
    new.id,
    new.phone,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'conductor'),
    coalesce((new.raw_user_meta_data->>'language')::app_language, 'fr')
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recalcul note moyenne + nombre d'avis (avis approuvés uniquement)
create or replace function public.recalc_garage_rating()
returns trigger language plpgsql as $$
declare
  gid uuid := coalesce(new.garage_id, old.garage_id);
begin
  update public.garages g
  set rating = coalesce((
        select round(avg(rating)::numeric, 1)
        from public.reviews where garage_id = gid and approved = true
      ), 0),
      review_count = (
        select count(*) from public.reviews where garage_id = gid and approved = true
      )
  where g.id = gid;
  return null;
end; $$;

create trigger trg_reviews_recalc
  after insert or update or delete on public.reviews
  for each row execute function public.recalc_garage_rating();

-- Demande → 'quoted' au premier devis
create or replace function public.mark_request_quoted()
returns trigger language plpgsql as $$
begin
  update public.quote_requests
  set status = 'quoted'
  where id = new.request_id and status = 'pending';
  return new;
end; $$;

create trigger trg_quote_marks_request
  after insert on public.quotes
  for each row execute function public.mark_request_quoted();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.users          enable row level security;
alter table public.vehicles       enable row level security;
alter table public.garages        enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quotes         enable row level security;
alter table public.messages       enable row level security;
alter table public.reviews        enable row level security;
alter table public.invoices       enable row level security;
alter table public.notifications  enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- helper : l'utilisateur courant possède-t-il ce garage ?
create or replace function public.owns_garage(g uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.garages where id = g and user_id = auth.uid());
$$;

-- ---------- users ----------
create policy "users: lecture publique"      on public.users for select using (true);
create policy "users: modifier le sien"      on public.users for update using (auth.uid() = id);
create policy "users: admin tout"            on public.users for all using (public.is_admin());

-- ---------- vehicles ----------
create policy "vehicles: propriétaire"       on public.vehicles for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- ---------- garages ----------
create policy "garages: visibles si actifs"  on public.garages for select
  using (suspended = false or user_id = auth.uid() or public.is_admin());
create policy "garages: propriétaire gère"   on public.garages for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "garages: admin tout"          on public.garages for all using (public.is_admin());

-- ---------- quote_requests ----------
create policy "requests: conducteur ou garage concerné" on public.quote_requests for select
  using (
    conductor_id = auth.uid()
    or public.is_admin()
    or public.owns_garage(garage_id)
    or (garage_id is null and exists (
          select 1 from public.garages g where g.user_id = auth.uid() and g.suspended = false))
  );
create policy "requests: conducteur gère"    on public.quote_requests for all
  using (conductor_id = auth.uid()) with check (conductor_id = auth.uid());
create policy "requests: garage met à jour"  on public.quote_requests for update
  using (public.owns_garage(garage_id));

-- ---------- quotes ----------
create policy "quotes: conducteur ou garage" on public.quotes for select
  using (
    public.is_admin()
    or public.owns_garage(garage_id)
    or exists (select 1 from public.quote_requests r where r.id = request_id and r.conductor_id = auth.uid())
  );
create policy "quotes: garage gère"          on public.quotes for all
  using (public.owns_garage(garage_id)) with check (public.owns_garage(garage_id));

-- ---------- messages ----------
create policy "messages: expéditeur/destinataire" on public.messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());
create policy "messages: envoi par l'expéditeur"  on public.messages for insert
  with check (sender_id = auth.uid());
create policy "messages: destinataire marque lu"  on public.messages for update
  using (recipient_id = auth.uid());

-- ---------- reviews ----------
create policy "reviews: avis approuvés publics"   on public.reviews for select
  using (approved = true or conductor_id = auth.uid() or public.is_admin());
create policy "reviews: conducteur écrit"         on public.reviews for all
  using (conductor_id = auth.uid()) with check (conductor_id = auth.uid());
create policy "reviews: admin modère"             on public.reviews for all using (public.is_admin());

-- ---------- invoices ----------
create policy "invoices: parties concernées"      on public.invoices for select
  using (
    public.is_admin()
    or public.owns_garage(garage_id)
    or exists (select 1 from public.quote_requests r where r.id = request_id and r.conductor_id = auth.uid())
  );
create policy "invoices: garage gère"             on public.invoices for all
  using (public.owns_garage(garage_id)) with check (public.owns_garage(garage_id));

-- ---------- notifications ----------
create policy "notifications: destinataire lit"   on public.notifications for select using (user_id = auth.uid());
create policy "notifications: destinataire màj"   on public.notifications for update using (user_id = auth.uid());

-- =============================================================
-- REALTIME (chat + notifs)
-- =============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.quote_requests;
alter publication supabase_realtime add table public.notifications;

-- =============================================================
-- STORAGE — bucket unique 'photos' (avatars, garages, véhicules,
-- demandes, interventions, documents). Organisation par dossiers.
-- =============================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "storage: lecture publique photos"
  on storage.objects for select using (bucket_id = 'photos');
create policy "storage: upload authentifié"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos');
create policy "storage: maj propriétaire"
  on storage.objects for update to authenticated using (owner = auth.uid());
create policy "storage: suppression propriétaire"
  on storage.objects for delete to authenticated using (owner = auth.uid());

-- =============================================================
-- FIN DU SCHÉMA
-- =============================================================
