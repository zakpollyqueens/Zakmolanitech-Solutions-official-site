create table if not exists public.study_lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 4 and 160),
  summary text not null default '' check (char_length(summary) <= 500),
  lesson_type text not null check (lesson_type in ('paid','weekend_free')),
  status text not null default 'draft' check (status in ('draft','published','cancelled','completed')),
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes between 15 and 240),
  price_amount bigint not null default 0 check (price_amount >= 0),
  currency text not null default 'UGX' check (currency in ('UGX','KES','TZS','USD')),
  country_code text check (country_code is null or country_code in ('UG','KE','TZ','INTL')),
  capacity integer check (capacity is null or capacity between 1 and 1000),
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_lesson_free_price check (
    (lesson_type = 'weekend_free' and price_amount = 0)
    or (lesson_type = 'paid' and price_amount > 0)
  )
);
create index if not exists study_lessons_public_schedule_idx on public.study_lessons (status, starts_at);

create table if not exists public.study_enrollments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.study_lessons(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  lesson_type text not null check (lesson_type in ('paid','weekend_free')),
  status text not null default 'pending_payment' check (status in ('pending_payment','pending_review','confirmed','rejected','expired','cancelled')),
  amount_due bigint not null default 0 check (amount_due >= 0),
  currency text not null default 'UGX' check (currency in ('UGX','KES','TZS','USD')),
  access_started_at timestamptz,
  access_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, student_id),
  constraint study_enrollment_access_window check (access_expires_at is null or (access_started_at is not null and access_expires_at > access_started_at))
);
create index if not exists study_enrollments_student_idx on public.study_enrollments (student_id, created_at desc);
create index if not exists study_enrollments_lesson_idx on public.study_enrollments (lesson_id, status);

create table if not exists public.study_payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.study_enrollments(id) on delete restrict,
  student_id uuid not null references auth.users(id) on delete restrict,
  provider text not null,
  provider_reference text unique,
  amount bigint not null check (amount > 0),
  currency text not null check (currency in ('UGX','KES','TZS','USD')),
  status text not null default 'pending' check (status in ('pending','completed','failed','refunded')),
  provider_payload jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists study_payments_student_idx on public.study_payments (student_id, created_at desc);
create index if not exists study_payments_enrollment_idx on public.study_payments (enrollment_id, status);

alter table public.study_lessons enable row level security;
alter table public.study_enrollments enable row level security;
alter table public.study_payments enable row level security;

create policy "Published study lessons are visible" on public.study_lessons for select to anon, authenticated using (status = 'published');
create policy "Study staff manage lessons" on public.study_lessons for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'staff_role') in ('admin','manager','staff','architect'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'staff_role') in ('admin','manager','staff','architect'));

create policy "Students view their study enrollments" on public.study_enrollments for select to authenticated using (student_id = (select auth.uid()));
create policy "Students request weekend study seats" on public.study_enrollments for insert to authenticated with check (
  student_id = (select auth.uid()) and lesson_type = 'weekend_free' and status = 'pending_review' and amount_due = 0
  and exists (select 1 from public.study_lessons l where l.id = lesson_id and l.lesson_type = 'weekend_free' and l.status = 'published' and l.starts_at > now())
);
create policy "Study staff manage enrollments" on public.study_enrollments for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'staff_role') in ('admin','manager','staff','architect'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'staff_role') in ('admin','manager','staff','architect'));

create policy "Students view their study payments" on public.study_payments for select to authenticated using (student_id = (select auth.uid()));
create policy "Study staff view payments" on public.study_payments for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'staff_role') in ('admin','manager','staff','architect'));

grant select on public.study_lessons to anon, authenticated;
grant insert, update, delete on public.study_lessons to authenticated;
grant select, insert, update on public.study_enrollments to authenticated;
grant select on public.study_payments to authenticated;
grant all on public.study_lessons, public.study_enrollments, public.study_payments to service_role;

create or replace function public.start_study_lesson(p_enrollment_id uuid)
returns table (enrollment_id uuid, lesson_id uuid, access_started_at timestamptz, access_expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_lesson_id uuid;
  v_enrollment_status text;
  v_started_at timestamptz;
  v_expires_at timestamptz;
  v_duration integer;
  v_lesson_status text;
begin
  if v_user_id is null then raise exception 'You must sign in to start a lesson.'; end if;
  select e.lesson_id, e.status, e.access_started_at, e.access_expires_at, l.duration_minutes, l.status
    into v_lesson_id, v_enrollment_status, v_started_at, v_expires_at, v_duration, v_lesson_status
  from public.study_enrollments e join public.study_lessons l on l.id = e.lesson_id
  where e.id = p_enrollment_id and e.student_id = v_user_id for update of e;
  if not found then raise exception 'The lesson enrolment could not be found.'; end if;
  if v_enrollment_status <> 'confirmed' then raise exception 'This lesson is not yet approved or paid.'; end if;
  if v_lesson_status not in ('published','completed') then raise exception 'This lesson is not currently available.'; end if;
  if v_expires_at is not null and v_expires_at <= now() then
    update public.study_enrollments set status = 'expired', updated_at = now() where id = p_enrollment_id and student_id = v_user_id;
    raise exception 'Your access time for this lesson has ended.';
  end if;
  if v_started_at is null then
    update public.study_enrollments set access_started_at = now(), access_expires_at = now() + make_interval(mins => v_duration), updated_at = now()
    where id = p_enrollment_id and student_id = v_user_id
    returning study_enrollments.access_started_at, study_enrollments.access_expires_at into v_started_at, v_expires_at;
  end if;
  return query select p_enrollment_id, v_lesson_id, v_started_at, v_expires_at;
end;
$$;
revoke all on function public.start_study_lesson(uuid) from public, anon;
grant execute on function public.start_study_lesson(uuid) to authenticated;
