-- Profile photos are public workspace avatars; writes remain restricted to the
-- authenticated owner folder. Profile and business fields remain in auth user metadata.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-profile-photos', 'client-profile-photos', true, 2097152, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Clients upload their own profile photos" on storage.objects;
create policy "Clients upload their own profile photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'client-profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Clients replace their own profile photos" on storage.objects;
create policy "Clients replace their own profile photos"
on storage.objects for update to authenticated
using (bucket_id = 'client-profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'client-profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Clients delete their own profile photos" on storage.objects;
create policy "Clients delete their own profile photos"
on storage.objects for delete to authenticated
using (bucket_id = 'client-profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
