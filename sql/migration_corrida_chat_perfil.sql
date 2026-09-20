-- =========================================================
-- MOTONHÃO — Expiração de corrida, chat, mapa real e perfil público
-- Rodar UMA vez no SQL Editor do Supabase.
-- Pode rodar de novo sem problema (tudo é "if not exists" / "or replace").
-- =========================================================

-- ---------------------------------------------------------
-- 1. COLUNAS NOVAS EM rides
--    - coordenadas da origem/destino: o mapa da corrida deixa de ser
--      um desenho genérico e passa a mostrar a rota real
--    - expires_at: hora em que a corrida se cancela sozinha se ninguém aceitar
--    - driver_lat/lng: posição ao vivo do motociclista durante a corrida
-- ---------------------------------------------------------
alter table public.rides add column if not exists origin_lat double precision;
alter table public.rides add column if not exists origin_lng double precision;
alter table public.rides add column if not exists destination_lat double precision;
alter table public.rides add column if not exists destination_lng double precision;
alter table public.rides add column if not exists driver_lat double precision;
alter table public.rides add column if not exists driver_lng double precision;
alter table public.rides add column if not exists driver_location_at timestamptz;
alter table public.rides
  add column if not exists expires_at timestamptz default (now() + interval '5 minutes');

create index if not exists idx_rides_expires_at on public.rides(expires_at);

-- Corridas antigas que ficaram "searching" para sempre ganham um prazo
-- retroativo e serão fechadas na primeira execução da função abaixo.
update public.rides
set expires_at = created_at + interval '5 minutes'
where status = 'searching' and expires_at is null;

-- ---------------------------------------------------------
-- 2. COLUNAS DE VERIFICAÇÃO DO MOTOCICLISTA
--    (o app já usa; isto só garante que existem)
-- ---------------------------------------------------------
do $$ begin
  create type driver_verification as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

alter table public.drivers
  add column if not exists verification_status driver_verification not null default 'approved';
alter table public.drivers add column if not exists verification_note text;

-- ---------------------------------------------------------
-- 3. FECHAR SOZINHA A CORRIDA QUE NINGUÉM ACEITOU
-- ---------------------------------------------------------

-- Cancela todas as corridas em "searching" cujo prazo já passou.
-- O app chama essa função sempre que abre o painel do passageiro ou do
-- motociclista, então ela roda mesmo sem agendador configurado.
create or replace function public.expire_stale_rides()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  affected integer;
begin
  update public.rides
  set status = 'cancelled'
  where status = 'searching'
    and driver_id is null
    and expires_at is not null
    and expires_at < now();

  get diagnostics affected = row_count;
  return affected;
end;
$$;

grant execute on function public.expire_stale_rides() to authenticated;

-- Trava de segurança: nem que dois cliques aconteçam ao mesmo tempo,
-- um motociclista consegue aceitar uma corrida cujo prazo já venceu.
create or replace function public.prevent_expired_accept()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.status = 'searching'
     and new.status = 'accepted'
     and old.expires_at is not null
     and old.expires_at < now() then
    raise exception 'Esta corrida expirou e não pode mais ser aceita.';
  end if;
  return new;
end;
$$;

drop trigger if exists on_ride_accept_check_expiry on public.rides;
create trigger on_ride_accept_check_expiry
  before update on public.rides
  for each row execute procedure public.prevent_expired_accept();

-- ---------------------------------------------------------
-- 4. CHAT DA CORRIDA
-- ---------------------------------------------------------
create table if not exists public.ride_messages (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists idx_ride_messages_ride_id on public.ride_messages(ride_id, created_at);

alter table public.ride_messages enable row level security;

-- Só quem está na corrida (passageiro ou motociclista) lê e escreve.
drop policy if exists "ride_messages_select_involved" on public.ride_messages;
create policy "ride_messages_select_involved"
  on public.ride_messages for select
  using (
    exists (
      select 1 from public.rides r
      where r.id = ride_messages.ride_id
        and (r.passenger_id = auth.uid() or r.driver_id = public.current_driver_id())
    )
    or public.is_admin()
  );

drop policy if exists "ride_messages_insert_involved" on public.ride_messages;
create policy "ride_messages_insert_involved"
  on public.ride_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.rides r
      where r.id = ride_messages.ride_id
        and (r.passenger_id = auth.uid() or r.driver_id = public.current_driver_id())
    )
  );

-- ---------------------------------------------------------
-- 5. PERFIL PÚBLICO + AVALIAÇÕES ESCRITAS
-- ---------------------------------------------------------

-- Dados públicos de um usuário (nome, foto, moto, nota, nº de corridas).
-- É "security definer" de propósito: expõe só estes campos, sem abrir
-- a tabela profiles inteira para todo mundo.
create or replace function public.public_profile(target uuid)
returns json
language sql
security definer set search_path = public
stable
as $$
  select json_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'role', p.role,
    'created_at', p.created_at,
    'driver', (
      select json_build_object(
        'id', d.id,
        'motorcycle_brand', d.motorcycle_brand,
        'motorcycle_model', d.motorcycle_model,
        'motorcycle_color', d.motorcycle_color,
        'license_plate', d.license_plate,
        'rating', d.rating,
        'total_rides', d.total_rides
      )
      from public.drivers d
      where d.profile_id = p.id
    ),
    'completed_rides', (
      select count(*) from public.rides r
      where r.passenger_id = p.id and r.status = 'completed'
    )
  )
  from public.profiles p
  where p.id = target;
$$;

grant execute on function public.public_profile(uuid) to authenticated;

-- Avaliações escritas que um motociclista recebeu, já com o nome e a foto
-- de quem escreveu. A reputação é pública dentro do app.
create or replace function public.driver_ratings(target_driver uuid)
returns table (
  id uuid,
  rating int,
  comment text,
  created_at timestamptz,
  passenger_id uuid,
  passenger_name text,
  passenger_avatar text
)
language sql
security definer set search_path = public
stable
as $$
  select
    ra.id,
    ra.rating,
    ra.comment,
    ra.created_at,
    p.id,
    p.full_name,
    p.avatar_url
  from public.ratings ra
  join public.profiles p on p.id = ra.passenger_id
  where ra.driver_id = target_driver
  order by ra.created_at desc
  limit 100;
$$;

grant execute on function public.driver_ratings(uuid) to authenticated;

-- ---------------------------------------------------------
-- 6. REALTIME
-- ---------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.ride_messages;
exception when duplicate_object then null; end $$;
