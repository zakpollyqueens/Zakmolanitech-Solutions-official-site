-- Avatar uploads use unique object names, so replacement is not required.
-- Keep only owner-scoped INSERT and DELETE operations.
drop policy if exists "Clients replace their own profile photos" on storage.objects;
