-- =========================================================
-- MOTONHÃO — Fotos de perfil (passageiro e motociclista)
-- Rodar UMA vez no SQL Editor do Supabase. Pode rodar de novo sem problema.
-- =========================================================

-- 1. A coluna já existe no schema original; isto só garante.
alter table public.profiles add column if not exists avatar_url text;

-- 2. Bucket público de leitura (a foto aparece na corrida pra quem está nela).
--    Limite de 2 MB: o app já reduz a foto pra ~512x512 antes de enviar.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3. Políticas: qualquer um LÊ; cada usuário só escreve dentro da própria pasta
--    (o arquivo fica em avatars/<id-do-usuario>/avatar.jpg).
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
