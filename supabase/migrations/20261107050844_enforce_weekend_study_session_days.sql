alter table public.study_lessons add constraint study_weekend_lessons_on_weekends
check (lesson_type <> 'weekend_free' or extract(isodow from starts_at at time zone 'Africa/Kampala') in (6,7));

drop policy if exists "Students request weekend study seats" on public.study_enrollments;
create policy "Students request weekend study seats" on public.study_enrollments for insert to authenticated with check (
  student_id = (select auth.uid()) and lesson_type = 'weekend_free' and status = 'pending_review' and amount_due = 0
  and exists (select 1 from public.study_lessons l where l.id = lesson_id and l.lesson_type = 'weekend_free'
    and l.status = 'published' and l.starts_at > now()
    and extract(isodow from l.starts_at at time zone 'Africa/Kampala') in (6,7))
);
