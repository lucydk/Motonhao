-- =========================================================
-- MOTONHÃO — Schema completo do Supabase
-- Rodar no SQL Editor do painel do Supabase, na ordem abaixo.
-- =========================================================

-- ---------------------------------------------------------
-- 1. EXTENSÕES
-- ---------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 2. TIPOS (ENUMS)
-- ---------------------------------------------------------
do $$ begin
  create type user_role as enum ('passenger', 'driver', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ride_type as enum ('economic', 'standard', 'fast');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ride_status as enum (
    'searching', 'accepted', 'driver_arriving', 'in_progress', 'completed', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('cash', 'pix', 'card');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------
-- 3. TABELA: profiles
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  role user_role not null default 'passenger',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 4. TABELA: drivers
-- ---------------------------------------------------------
create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  motorcycle_brand text not null,
  motorcycle_model text not null,
  motorcycle_year int,
  motorcycle_color text,
  license_plate text not null,
  rating numeric(3,2) not null default 5.00,
  total_rides int not null default 0,
  is_online boolean not null default false,
  created_at timestamptz not null default now(),
  constraint drivers_profile_unique unique (profile_id)
);

create index if not exists idx_drivers_profile_id on public.drivers(profile_id);
create index if not exists idx_drivers_is_online on public.drivers(is_online);

-- ---------------------------------------------------------
-- 5. TABELA: rides
-- ---------------------------------------------------------
create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete set null,
  origin text not null,
  destination text not null,
  distance numeric(6,2) not null,
  estimated_time int not null,
  price numeric(8,2) not null,
  ride_type ride_type not null default 'standard',
  status ride_status not null default 'searching',
  payment_method payment_method not null default 'cash',
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_rides_passenger_id on public.rides(passenger_id);
create index if not exists idx_rides_driver_id on public.rides(driver_id);
create index if not exists idx_rides_status on public.rides(status);
create index if not exists idx_rides_created_at on public.rides(created_at desc);

-- ---------------------------------------------------------
-- 6. TABELA: ratings
-- ---------------------------------------------------------
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  constraint ratings_ride_unique unique (ride_id)
);

create index if not exists idx_ratings_driver_id on public.ratings(driver_id);

-- ---------------------------------------------------------
-- 7. TABELA: payments
-- ---------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(8,2) not null,
  method payment_method not null,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  constraint payments_ride_unique unique (ride_id)
);

create index if not exists idx_payments_passenger_id on public.payments(passenger_id);

-- ---------------------------------------------------------
-- 8. FUNCTION + TRIGGER: cria profile automaticamente no cadastro
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuário Motonhão'),
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'passenger')
  );

  if coalesce(new.raw_user_meta_data->>'role', 'passenger') = 'driver' then
    insert into public.drivers (profile_id, motorcycle_brand, motorcycle_model, motorcycle_year, motorcycle_color, license_plate)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'motorcycle_brand', ''),
      coalesce(new.raw_user_meta_data->>'motorcycle_model', ''),
      nullif(new.raw_user_meta_data->>'motorcycle_year', '')::int,
      coalesce(new.raw_user_meta_data->>'motorcycle_color', ''),
      coalesce(new.raw_user_meta_data->>'license_plate', '')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------
-- 9. FUNCTION + TRIGGER: atualiza média e total de corridas do motorista
-- ---------------------------------------------------------
create or replace function public.handle_new_rating()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.drivers
  set rating = (
    select round(avg(r.rating)::numeric, 2)
    from public.ratings r
    where r.driver_id = new.driver_id
  )
  where id = new.driver_id;

  return new;
end;
$$;

drop trigger if exists on_rating_created on public.ratings;
create trigger on_rating_created
  after insert on public.ratings
  for each row execute procedure public.handle_new_rating();

-- ---------------------------------------------------------
-- 10. FUNCTION + TRIGGER: incrementa total_rides quando a corrida é concluída
-- ---------------------------------------------------------
create or replace function public.handle_ride_completed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update public.drivers
    set total_rides = total_rides + 1
    where id = new.driver_id;

    new.completed_at = coalesce(new.completed_at, now());
  end if;

  if new.status = 'in_progress' and old.status is distinct from 'in_progress' then
    new.started_at = coalesce(new.started_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists on_ride_status_change on public.rides;
create trigger on_ride_status_change
  before update on public.rides
  for each row execute procedure public.handle_ride_completed();

-- ---------------------------------------------------------
-- 11. FUNCTION + TRIGGER: cria payment automaticamente ao criar corrida
-- ---------------------------------------------------------
create or replace function public.handle_new_ride()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.payments (ride_id, passenger_id, amount, method, status)
  values (new.id, new.passenger_id, new.price, new.payment_method, 'pending');
  return new;
end;
$$;

drop trigger if exists on_ride_created on public.rides;
create trigger on_ride_created
  after insert on public.rides
  for each row execute procedure public.handle_new_ride();

-- ---------------------------------------------------------
-- 12. FUNCTION + TRIGGER: marca payment como pago quando corrida é concluída
-- ---------------------------------------------------------
create or replace function public.handle_payment_on_completion()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update public.payments set status = 'paid' where ride_id = new.id;
  elsif new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update public.payments set status = 'refunded' where ride_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_ride_payment_update on public.rides;
create trigger on_ride_payment_update
  after update on public.rides
  for each row execute procedure public.handle_payment_on_completion();

-- =========================================================
-- 13. ROW LEVEL SECURITY
-- =========================================================
alter table public.profiles enable row level security;
alter table public.drivers  enable row level security;
alter table public.rides    enable row level security;
alter table public.ratings  enable row level security;
alter table public.payments enable row level security;

-- Helper: função para checar se o usuário logado é admin (evita recursão em policies)
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: pega o driver.id do usuário logado (se for motorista)
create or replace function public.current_driver_id()
returns uuid
language sql
security definer set search_path = public
stable
as $$
  select id from public.drivers where profile_id = auth.uid();
$$;

-- ---------------- PROFILES ----------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (
    id = auth.uid()
    or public.is_admin()
    -- permite que passageiro e motociclista vejam o perfil um do outro
    -- quando estão (ou estiveram) ligados por uma corrida
    or exists (
      select 1 from public.rides r
      join public.drivers d on d.id = r.driver_id
      where (r.passenger_id = auth.uid() and d.profile_id = profiles.id)
         or (d.profile_id = auth.uid() and r.passenger_id = profiles.id)
    )
  );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- ---------------- DRIVERS ----------------
drop policy if exists "drivers_select_all_authenticated" on public.drivers;
create policy "drivers_select_all_authenticated"
  on public.drivers for select
  to authenticated
  using (true);
  -- Necessário para o passageiro ver dados do motorista da própria corrida
  -- e para motoristas verem a lista de disponibilidade entre si.

drop policy if exists "drivers_insert_own" on public.drivers;
create policy "drivers_insert_own"
  on public.drivers for insert
  with check (profile_id = auth.uid());

drop policy if exists "drivers_update_own_or_admin" on public.drivers;
create policy "drivers_update_own_or_admin"
  on public.drivers for update
  using (profile_id = auth.uid() or public.is_admin());

-- ---------------- RIDES ----------------
drop policy if exists "rides_select_involved_or_admin" on public.rides;
create policy "rides_select_involved_or_admin"
  on public.rides for select
  using (
    passenger_id = auth.uid()
    or driver_id = public.current_driver_id()
    or (status = 'searching' and public.current_driver_id() is not null)
    or public.is_admin()
  );

drop policy if exists "rides_insert_own_passenger" on public.rides;
create policy "rides_insert_own_passenger"
  on public.rides for insert
  with check (passenger_id = auth.uid());

drop policy if exists "rides_update_passenger_cancel" on public.rides;
create policy "rides_update_passenger_cancel"
  on public.rides for update
  using (
    passenger_id = auth.uid()
    or driver_id = public.current_driver_id()
    -- permite que um motociclista online "aceite" uma corrida ainda sem motorista
    or (status = 'searching' and driver_id is null and public.current_driver_id() is not null)
    or public.is_admin()
  )
  with check (
    passenger_id = auth.uid()
    or driver_id = public.current_driver_id()
    or public.is_admin()
  );

-- ---------------- RATINGS ----------------
drop policy if exists "ratings_select_involved_or_admin" on public.ratings;
create policy "ratings_select_involved_or_admin"
  on public.ratings for select
  using (passenger_id = auth.uid() or driver_id = public.current_driver_id() or public.is_admin());

drop policy if exists "ratings_insert_own_passenger" on public.ratings;
create policy "ratings_insert_own_passenger"
  on public.ratings for insert
  with check (passenger_id = auth.uid());

-- ---------------- PAYMENTS ----------------
drop policy if exists "payments_select_involved_or_admin" on public.payments;
create policy "payments_select_involved_or_admin"
  on public.payments for select
  using (
    passenger_id = auth.uid()
    or exists (
      select 1 from public.rides r
      where r.id = payments.ride_id and r.driver_id = public.current_driver_id()
    )
    or public.is_admin()
  );

drop policy if exists "payments_insert_system" on public.payments;
create policy "payments_insert_system"
  on public.payments for insert
  with check (passenger_id = auth.uid());

drop policy if exists "payments_update_involved_or_admin" on public.payments;
create policy "payments_update_involved_or_admin"
  on public.payments for update
  using (passenger_id = auth.uid() or public.is_admin());

-- =========================================================
-- 14. REALTIME
-- =========================================================
alter publication supabase_realtime add table public.rides;
alter publication supabase_realtime add table public.drivers;

-- =========================================================
-- 15. PRIMEIRO ADMINISTRADOR
-- =========================================================
-- Depois de cadastrar um usuário normalmente pelo app (como passageiro,
-- por exemplo), rode o comando abaixo substituindo o e-mail:
--
-- update public.profiles set role = 'admin' where email = 'seu-email@exemplo.com';
--
-- Pronto: ao fazer login novamente, esse usuário terá acesso a /admin.
