alter table public.study_lesson_resources
  add column if not exists storage_path text;

alter table public.study_lesson_resources
  drop constraint if exists study_lesson_resources_resource_type_check;

alter table public.study_lesson_resources
  add constraint study_lesson_resources_resource_type_check
  check (resource_type in ('link','video','document','meeting','text','audio'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study-lesson-audio',
  'study-lesson-audio',
  false,
  52428800,
  array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav','audio/aac','audio/3gpp','audio/x-m4a']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Study staff upload lesson audio" on storage.objects;
create policy "Study staff upload lesson audio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'study-lesson-audio'
  and (auth.jwt() -> 'app_metadata' ->> 'staff_role') in ('admin','manager','staff','architect')
  and exists (
    select 1 from public.study_lessons l
    where l.id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists "Study staff update lesson audio" on storage.objects;
create policy "Study staff update lesson audio"
on storage.objects for update to authenticated
using (
  bucket_id = 'study-lesson-audio'
  and (auth.jwt() -> 'app_metadata' ->> 'staff_role') in ('admin','manager','staff','architect')
)
with check (
  bucket_id = 'study-lesson-audio'
  and (auth.jwt() -> 'app_metadata' ->> 'staff_role') in ('admin','manager','staff','architect')
);

drop policy if exists "Study staff delete lesson audio" on storage.objects;
create policy "Study staff delete lesson audio"
on storage.objects for delete to authenticated
using (
  bucket_id = 'study-lesson-audio'
  and (auth.jwt() -> 'app_metadata' ->> 'staff_role') in ('admin','manager','staff','architect')
);

drop policy if exists "Enrolled students read active lesson audio" on storage.objects;
create policy "Enrolled students read active lesson audio"
on storage.objects for select to authenticated
using (
  bucket_id = 'study-lesson-audio'
  and (
    (auth.jwt() -> 'app_metadata' ->> 'staff_role') in ('admin','manager','staff','architect')
    or exists (
      select 1
      from public.study_enrollments e
      where e.lesson_id::text = (storage.foldername(name))[1]
        and e.student_id = (select auth.uid())
        and e.status = 'confirmed'
        and e.access_started_at is not null
        and e.access_expires_at > now()
    )
  )
);

comment on column public.study_lesson_resources.storage_path is
  'Private Supabase Storage object path for lesson audio; students receive short-lived signed URLs only while their lesson access is active.';
