-- =========================================================
-- MOTONHÃO — Cadastro completo do motociclista (CPF, CNH, moto, CRLV)
-- Rodar UMA vez no SQL Editor do Supabase. Pode rodar de novo sem problema.
-- =========================================================

-- ---------------------------------------------------------
-- 1. CPF no perfil
-- ---------------------------------------------------------
alter table public.profiles add column if not exists cpf text;

-- Um CPF por conta (contas antigas sem CPF continuam válidas).
create unique index if not exists idx_profiles_cpf_unique
  on public.profiles(cpf) where cpf is not null;

-- ---------------------------------------------------------
-- 2. Documentos do motociclista
--    Guardamos só o CAMINHO do arquivo no Storage, nunca uma URL pública:
--    CNH e CRLV são documentos sensíveis e ficam em bucket privado.
-- ---------------------------------------------------------
alter table public.drivers add column if not exists cnh_photo_path text;
alter table public.drivers add column if not exists motorcycle_photo_path text;
alter table public.drivers add column if not exists crlv_photo_path text;
alter table public.drivers add column if not exists documents_submitted_at timestamptz;

-- ---------------------------------------------------------
-- 3. Trigger de cadastro: passa a gravar o CPF também
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, cpf, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuário Motonhão'),
    new.email,
    new.raw_user_meta_data->>'phone',
    nullif(new.raw_user_meta_data->>'cpf', ''),
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

-- ---------------------------------------------------------
-- 4. Bucket PRIVADO para CNH / foto da moto / CRLV
--    Diferente do bucket "avatars", este NÃO é público: só o dono do
--    documento e o administrador conseguem abrir, e mesmo assim por meio
--    de um link temporário gerado na hora.
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Leitura: só o próprio dono (pasta = id do usuário) ou o administrador.
drop policy if exists "documents_read_own_or_admin" on storage.objects;
create policy "documents_read_own_or_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "documents_insert_own" on storage.objects;
create policy "documents_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents_update_own" on storage.objects;
create policy "documents_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents_delete_own" on storage.objects;
create policy "documents_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- =========================================================
-- OPCIONAL — exigir aprovação do administrador
-- ---------------------------------------------------------
-- Hoje todo motociclista novo já entra liberado, pra não travar os testes.
-- Se quiser que cada cadastro passe pela tela /admin/motociclistas antes de
-- poder ficar online, rode a linha abaixo:
--
-- alter table public.drivers alter column verification_status set default 'pending';
-- =========================================================
