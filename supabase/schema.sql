-- =============================================================
-- CarLink — Schéma complet de la base de données
-- PostgreSQL / Supabase
-- À exécuter dans : Supabase Dashboard → SQL Editor → New query
-- =============================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";

-- =============================================================
-- ENUMS
-- =============================================================
create type user_role        as enum ('driver', 'garage_owner', 'admin');
create type garage_status     as enum ('pending', 'approved', 'suspended', 'rejected');
create type request_status    as enum ('open', 'quoted', 'accepted', 'in_progress', 'completed', 'cancelled');
create type quote_status      as enum ('pending', 'accepted', 'rejected', 'expired');
create type notification_type as enum ('quote_received', 'quote_accepted', 'new_message', 'request_update', 'garage_approved', 'review_received');

-- =============================================================
-- TABLE : profiles  (extension de auth.users)
-- =============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'driver',
  full_name   text,
  phone       text,
  avatar_url  text,
  city        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =============================================================
-- TABLE : vehicles
-- =============================================================
create table public.vehicles (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  make          text not null,
  model         text not null,
  year          int,
  license_plate text,
  vin           text,
  mileage       int,
  photo_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index vehicles_owner_idx on public.vehicles(owner_id);

-- =============================================================
-- TABLE : garages
-- =============================================================
create table public.garages (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  description  text,
  address      text,
  city         text,
  latitude     double precision,
  longitude    double precision,
  phone        text,
  logo_url     text,
  services     text[] default '{}',
  status       garage_status not null default 'pending',
  rating_avg   numeric(2,1) not null default 0,
  rating_count int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index garages_owner_idx  on public.garages(owner_id);
create index garages_status_idx on public.garages(status);
create index garages_geo_idx    on public.garages(latitude, longitude);

-- =============================================================
-- TABLE : garage_photos
-- =============================================================
create table public.garage_photos (
  id         uuid primary key default uuid_generate_v4(),
  garage_id  uuid not null references public.garages(id) on delete cascade,
  url        text not null,
  created_at timestamptz not null default now()
);
create index garage_photos_garage_idx on public.garage_photos(garage_id);

-- =============================================================
-- TABLE : service_requests
-- =============================================================
create table public.service_requests (
  id             uuid primary key default uuid_generate_v4(),
  driver_id      uuid not null references public.profiles(id) on delete cascade,
  vehicle_id     uuid references public.vehicles(id) on delete set null,
  title          text not null,
  description    text,
  category       text,
  status         request_status not null default 'open',
  latitude       double precision,
  longitude      double precision,
  preferred_date date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index requests_driver_idx on public.service_requests(driver_id);
create index requests_status_idx on public.service_requests(status);

-- =============================================================
-- TABLE : request_photos
-- =============================================================
create table public.request_photos (
  id         uuid primary key default uuid_generate_v4(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  url        text not null,
  created_at timestamptz not null default now()
);
create index request_photos_request_idx on public.request_photos(request_id);

-- =============================================================
-- TABLE : quotes
-- =============================================================
create table public.quotes (
  id                 uuid primary key default uuid_generate_v4(),
  request_id         uuid not null references public.service_requests(id) on delete cascade,
  garage_id          uuid not null references public.garages(id) on delete cascade,
  amount             numeric(12,2) not null,
  currency           text not null default 'XAF',
  estimated_duration text,
  message            text,
  status             quote_status not null default 'pending',
  valid_until        date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (request_id, garage_id)
);
create index quotes_request_idx on public.quotes(request_id);
create index quotes_garage_idx  on public.quotes(garage_id);

-- =============================================================
-- TABLE : conversations
-- =============================================================
create table public.conversations (
  id         uuid primary key default uuid_generate_v4(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  driver_id  uuid not null references public.profiles(id) on delete cascade,
  garage_id  uuid not null references public.garages(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (request_id, garage_id)
);
create index conversations_driver_idx on public.conversations(driver_id);
create index conversations_garage_idx on public.conversations(garage_id);

-- =============================================================
-- TABLE : messages  (chat temps réel)
-- =============================================================
create table public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  content         text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index messages_conversation_idx on public.messages(conversation_id);

-- =============================================================
-- TABLE : reviews
-- =============================================================
create table public.reviews (
  id         uuid primary key default uuid_generate_v4(),
  garage_id  uuid not null references public.garages(id) on delete cascade,
  driver_id  uuid not null references public.profiles(id) on delete cascade,
  request_id uuid references public.service_requests(id) on delete set null,
  rating     int not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  unique (driver_id, request_id)
);
create index reviews_garage_idx on public.reviews(garage_id);

-- =============================================================
-- TABLE : notifications
-- =============================================================
create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       notification_type not null,
  title      text not null,
  body       text,
  data       jsonb default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id);

-- =============================================================
-- FONCTIONS & TRIGGERS
-- =============================================================

-- updated_at automatique
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger trg_profiles_updated   before update on public.profiles         for each row execute function public.set_updated_at();
create trigger trg_vehicles_updated   before update on public.vehicles         for each row execute function public.set_updated_at();
create trigger trg_garages_updated    before update on public.garages          for each row execute function public.set_updated_at();
create trigger trg_requests_updated   before update on public.service_requests for each row execute function public.set_updated_at();
create trigger trg_quotes_updated     before update on public.quotes           for each row execute function public.set_updated_at();

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'driver'),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recalcul de la note moyenne du garage
create or replace function public.recalc_garage_rating()
returns trigger language plpgsql as $$
declare
  gid uuid := coalesce(new.garage_id, old.garage_id);
begin
  update public.garages g
  set rating_avg = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where garage_id = gid), 0),
      rating_count = (select count(*) from public.reviews where garage_id = gid)
  where g.id = gid;
  return null;
end; $$;

create trigger trg_reviews_recalc
  after insert or update or delete on public.reviews
  for each row execute function public.recalc_garage_rating();

-- Passe la demande en "quoted" dès qu'un devis arrive
create or replace function public.mark_request_quoted()
returns trigger language plpgsql as $$
begin
  update public.service_requests
  set status = 'quoted'
  where id = new.request_id and status = 'open';
  return new;
end; $$;

create trigger trg_quote_marks_request
  after insert on public.quotes
  for each row execute function public.mark_request_quoted();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.profiles         enable row level security;
alter table public.vehicles         enable row level security;
alter table public.garages          enable row level security;
alter table public.garage_photos    enable row level security;
alter table public.service_requests enable row level security;
alter table public.request_photos   enable row level security;
alter table public.quotes           enable row level security;
alter table public.conversations    enable row level security;
alter table public.messages         enable row level security;
alter table public.reviews          enable row level security;
alter table public.notifications    enable row level security;

-- Helper : l'utilisateur courant est-il admin ?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- profiles ----------
create policy "profiles: lecture publique"        on public.profiles for select using (true);
create policy "profiles: modifier le sien"        on public.profiles for update using (auth.uid() = id);
create policy "profiles: admin tout"              on public.profiles for all using (public.is_admin());

-- ---------- vehicles ----------
create policy "vehicles: propriétaire lit"        on public.vehicles for select using (auth.uid() = owner_id or public.is_admin());
create policy "vehicles: propriétaire écrit"      on public.vehicles for all    using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ---------- garages ----------
create policy "garages: voir approuvés ou siens"  on public.garages for select
  using (status = 'approved' or owner_id = auth.uid() or public.is_admin());
create policy "garages: propriétaire gère"        on public.garages for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "garages: admin tout"               on public.garages for all using (public.is_admin());

-- ---------- garage_photos ----------
create policy "garage_photos: lecture"            on public.garage_photos for select using (true);
create policy "garage_photos: propriétaire gère"  on public.garage_photos for all
  using (exists (select 1 from public.garages g where g.id = garage_id and g.owner_id = auth.uid()));

-- ---------- service_requests ----------
create policy "requests: conducteur ou garages approuvés" on public.service_requests for select
  using (
    driver_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.garages g where g.owner_id = auth.uid() and g.status = 'approved')
  );
create policy "requests: conducteur gère"         on public.service_requests for all
  using (driver_id = auth.uid()) with check (driver_id = auth.uid());

-- ---------- request_photos ----------
create policy "request_photos: lecture liée"      on public.request_photos for select
  using (exists (select 1 from public.service_requests r where r.id = request_id
                 and (r.driver_id = auth.uid() or public.is_admin())));
create policy "request_photos: conducteur gère"   on public.request_photos for all
  using (exists (select 1 from public.service_requests r where r.id = request_id and r.driver_id = auth.uid()));

-- ---------- quotes ----------
create policy "quotes: conducteur ou garage concerné" on public.quotes for select
  using (
    public.is_admin()
    or exists (select 1 from public.garages g where g.id = garage_id and g.owner_id = auth.uid())
    or exists (select 1 from public.service_requests r where r.id = request_id and r.driver_id = auth.uid())
  );
create policy "quotes: garage crée/modifie"       on public.quotes for all
  using (exists (select 1 from public.garages g where g.id = garage_id and g.owner_id = auth.uid()))
  with check (exists (select 1 from public.garages g where g.id = garage_id and g.owner_id = auth.uid()));
create policy "quotes: conducteur change statut"  on public.quotes for update
  using (exists (select 1 from public.service_requests r where r.id = request_id and r.driver_id = auth.uid()));

-- ---------- conversations ----------
create policy "conversations: participants"       on public.conversations for select
  using (
    driver_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.garages g where g.id = garage_id and g.owner_id = auth.uid())
  );
create policy "conversations: participants créent" on public.conversations for insert
  with check (
    driver_id = auth.uid()
    or exists (select 1 from public.garages g where g.id = garage_id and g.owner_id = auth.uid())
  );

-- ---------- messages ----------
create policy "messages: participants lisent"     on public.messages for select
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.driver_id = auth.uid()
           or exists (select 1 from public.garages g where g.id = c.garage_id and g.owner_id = auth.uid()))
  ));
create policy "messages: envoi par participant"   on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.driver_id = auth.uid()
             or exists (select 1 from public.garages g where g.id = c.garage_id and g.owner_id = auth.uid()))
    )
  );

-- ---------- reviews ----------
create policy "reviews: lecture publique"         on public.reviews for select using (true);
create policy "reviews: conducteur écrit"         on public.reviews for all
  using (driver_id = auth.uid()) with check (driver_id = auth.uid());
create policy "reviews: admin modère"             on public.reviews for all using (public.is_admin());

-- ---------- notifications ----------
create policy "notifications: destinataire lit"   on public.notifications for select using (user_id = auth.uid());
create policy "notifications: destinataire màj"   on public.notifications for update using (user_id = auth.uid());

-- =============================================================
-- REALTIME (chat) — activer la publication
-- =============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.notifications;

-- =============================================================
-- STORAGE — buckets pour les photos
-- (créer aussi via Dashboard → Storage si besoin)
-- =============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true),
       ('garages', 'garages', true),
       ('vehicles', 'vehicles', true),
       ('requests', 'requests', true)
on conflict (id) do nothing;

create policy "storage: lecture publique"
  on storage.objects for select using (bucket_id in ('avatars','garages','vehicles','requests'));
create policy "storage: upload authentifié"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars','garages','vehicles','requests'));
create policy "storage: maj/suppression propriétaire"
  on storage.objects for update to authenticated using (owner = auth.uid());
create policy "storage: suppression propriétaire"
  on storage.objects for delete to authenticated using (owner = auth.uid());

-- =============================================================
-- FIN DU SCHÉMA
-- =============================================================
