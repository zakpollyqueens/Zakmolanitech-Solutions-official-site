drop policy if exists "Students request weekend study seats" on public.study_enrollments;
alter table public.study_lessons alter column price_amount type numeric(12,2);
alter table public.study_enrollments alter column amount_due type numeric(12,2);
alter table public.study_payments alter column amount type numeric(12,2);

create policy "Students request weekend study seats" on public.study_enrollments for insert to authenticated with check (
  student_id = (select auth.uid()) and lesson_type = 'weekend_free' and status = 'pending_review' and amount_due = 0
  and exists (select 1 from public.study_lessons l where l.id = lesson_id and l.lesson_type = 'weekend_free' and l.status = 'published' and l.starts_at > now())
);

create table if not exists public.study_lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.study_lessons(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  resource_type text not null default 'link' check (resource_type in ('link','video','document','meeting','text')),
  content_url text check (content_url is null or content_url ~ '^https://'),
  content_text text not null default '' check (char_length(content_text) <= 20000),
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists study_lesson_resources_lesson_idx on public.study_lesson_resources (lesson_id, sort_order, created_at);
alter table public.study_lesson_resources enable row level security;

create policy "Enrolled students can access active lesson resources" on public.study_lesson_resources for select to authenticated using (
  exists (select 1 from public.study_enrollments e where e.lesson_id = study_lesson_resources.lesson_id
    and e.student_id = (select auth.uid()) and e.status = 'confirmed'
    and e.access_started_at is not null and e.access_expires_at > now())
);
create policy "Study staff manage lesson resources" on public.study_lesson_resources for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'staff_role') in ('admin','manager','staff','architect'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'staff_role') in ('admin','manager','staff','architect'));
grant select on public.study_lesson_resources to authenticated;
grant insert, update, delete on public.study_lesson_resources to authenticated;
grant all on public.study_lesson_resources to service_role;
