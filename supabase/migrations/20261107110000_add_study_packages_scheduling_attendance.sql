-- Lesson packages, instructor scheduling, attendance and student notifications.
create table if not exists public.study_package_catalog (
 id text primary key, title text not null, session_count integer not null check(session_count>0),
 price_ugx numeric(12,2) not null check(price_ugx>0), description text not null default '',
 active boolean not null default true, sort_order integer not null default 0, created_at timestamptz not null default now()
);
insert into public.study_package_catalog(id,title,session_count,price_ugx,description,sort_order) values
 ('one-session','1-hour lesson',1,10000,'One scheduled one-hour lesson.',1),
 ('two-sessions','2-hour package',2,20000,'Two scheduled one-hour lessons.',2),
 ('seven-sessions','7-day package',7,50000,'Seven one-hour lessons on instructor-scheduled dates.',3),
 ('fourteen-sessions','14-day package',14,100000,'Fourteen one-hour lessons on instructor-scheduled dates.',4),
 ('twenty-eight-sessions','28-day package',28,200000,'Twenty-eight one-hour lessons on instructor-scheduled dates.',5)
on conflict(id) do update set title=excluded.title,session_count=excluded.session_count,price_ugx=excluded.price_ugx,description=excluded.description,sort_order=excluded.sort_order;

create table if not exists public.study_package_subscriptions (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references auth.users(id) on delete cascade,
 package_id text not null references public.study_package_catalog(id), total_sessions integer not null check(total_sessions>0),
 amount_paid numeric(12,2) not null check(amount_paid>0), currency text not null default 'UGX' check(currency='UGX'),
 status text not null default 'pending_payment' check(status in ('pending_payment','active','completed','cancelled','refunded')),
 purchased_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists study_package_subscriptions_student_idx on public.study_package_subscriptions(student_id,created_at desc);
create index if not exists study_package_subscriptions_package_idx on public.study_package_subscriptions(package_id);

create table if not exists public.study_scheduled_sessions (
 id uuid primary key default gen_random_uuid(), title text not null check(char_length(btrim(title)) between 4 and 160),
 summary text not null default '', starts_at timestamptz not null, duration_minutes integer not null default 60 check(duration_minutes=60),
 meeting_url text, status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')),
 created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists study_scheduled_sessions_start_idx on public.study_scheduled_sessions(starts_at);
create index if not exists study_scheduled_sessions_created_by_idx on public.study_scheduled_sessions(created_by);

create table if not exists public.study_session_attendance (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.study_scheduled_sessions(id) on delete cascade,
 subscription_id uuid not null references public.study_package_subscriptions(id) on delete cascade,
 student_id uuid not null references auth.users(id) on delete cascade,
 acknowledgement text not null default 'pending' check(acknowledgement in ('pending','acknowledged')),
 acknowledged_at timestamptz, attendance_status text not null default 'scheduled' check(attendance_status in ('scheduled','attended','missed','excused')),
 marked_by uuid references auth.users(id), marked_at timestamptz, created_at timestamptz not null default now(),
 unique(session_id,subscription_id)
);
create index if not exists study_session_attendance_student_idx on public.study_session_attendance(student_id,created_at desc);
create index if not exists study_session_attendance_subscription_idx on public.study_session_attendance(subscription_id);
create index if not exists study_session_attendance_marked_by_idx on public.study_session_attendance(marked_by);

create table if not exists public.study_package_payments (
 id uuid primary key default gen_random_uuid(), subscription_id uuid not null references public.study_package_subscriptions(id) on delete cascade,
 student_id uuid not null references auth.users(id) on delete cascade,
 provider text not null check(provider in ('jjuma','airtel_money_manual')), provider_reference text unique,
 amount numeric(12,2) not null check(amount>0), currency text not null default 'UGX' check(currency='UGX'),
 status text not null default 'pending' check(status in ('pending','completed','failed','refunded')),
 provider_payload jsonb not null default '{}'::jsonb, paid_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists study_package_payments_pending_idx on public.study_package_payments(provider,status,created_at);
create index if not exists study_package_payments_subscription_idx on public.study_package_payments(subscription_id);
create index if not exists study_package_payments_student_idx on public.study_package_payments(student_id);

create table if not exists public.study_session_notifications (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null references public.study_scheduled_sessions(id) on delete cascade,
 attendance_id uuid not null references public.study_session_attendance(id) on delete cascade,
 title text not null, message text not null, notification_type text not null check(notification_type in ('lesson_scheduled','lesson_missed','package_completed')),
 is_read boolean not null default false, created_at timestamptz not null default now(), unique(attendance_id,notification_type)
);
create index if not exists study_session_notifications_session_idx on public.study_session_notifications(session_id);
create index if not exists study_session_notifications_student_idx on public.study_session_notifications(student_id);

create or replace function public.study_package_remaining(p_subscription_id uuid)
returns integer language sql stable security invoker set search_path=''
as $$
 select greatest(s.total_sessions-count(a.id)::integer,0) from public.study_package_subscriptions s
 left join public.study_session_attendance a on a.subscription_id=s.id and a.attendance_status in ('scheduled','attended','missed')
 where s.id=p_subscription_id group by s.total_sessions
$$;

create or replace function public.study_schedule_session_for_active_students()
returns trigger language plpgsql security definer set search_path=''
as $$
declare sub record; att_id uuid; remaining integer;
begin
 for sub in select s.* from public.study_package_subscriptions s where s.status='active' order by s.created_at loop
  remaining:=public.study_package_remaining(sub.id);
  if remaining>0 then
   insert into public.study_session_attendance(session_id,subscription_id,student_id) values(new.id,sub.id,sub.student_id)
   on conflict(session_id,subscription_id) do nothing returning id into att_id;
   if att_id is not null then
    insert into public.study_session_notifications(student_id,session_id,attendance_id,title,message,notification_type)
    values(sub.student_id,new.id,att_id,'New lesson scheduled',new.title||' is scheduled for '||
    to_char(new.starts_at at time zone 'Africa/Kampala','Dy, DD Mon YYYY HH:MI AM')||'. Please acknowledge your attendance.','lesson_scheduled')
    on conflict do nothing;
   end if;
   att_id:=null;
  end if;
 end loop;
 return new;
end $$;
drop trigger if exists study_session_schedule_notify on public.study_scheduled_sessions;
create trigger study_session_schedule_notify after insert on public.study_scheduled_sessions for each row execute function public.study_schedule_session_for_active_students();

create or replace function public.acknowledge_study_session(p_attendance_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 update public.study_session_attendance set acknowledgement='acknowledged',acknowledged_at=now()
 where id=p_attendance_id and student_id=auth.uid() and attendance_status='scheduled';
 if not found then raise exception 'This lesson acknowledgement is unavailable.'; end if;
 return true;
end $$;

create or replace function public.mark_study_attendance(p_attendance_id uuid,p_status text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_student uuid; v_session uuid; v_title text; v_subscription uuid; v_completed boolean:=false;
begin
 if coalesce(auth.jwt()->'app_metadata'->>'staff_role','') not in ('admin','manager','staff','architect') then raise exception 'Authorised learning staff only.'; end if;
 if p_status not in ('attended','missed','excused') then raise exception 'Invalid attendance status.'; end if;
 select a.student_id,a.session_id,s.title,a.subscription_id into v_student,v_session,v_title,v_subscription
 from public.study_session_attendance a join public.study_scheduled_sessions s on s.id=a.session_id where a.id=p_attendance_id;
 if not found then raise exception 'Attendance record not found.'; end if;
 update public.study_session_attendance set attendance_status=p_status,marked_by=auth.uid(),marked_at=now()
 where id=p_attendance_id and attendance_status='scheduled';
 if not found then raise exception 'Attendance was already recorded.'; end if;
 if p_status='missed' then
  insert into public.study_session_notifications(student_id,session_id,attendance_id,title,message,notification_type)
  values(v_student,v_session,p_attendance_id,'Missed lesson warning','You missed the scheduled lesson: '||v_title||'. This session has been deducted from your package.','lesson_missed')
  on conflict(attendance_id,notification_type) do nothing;
 end if;
 update public.study_package_subscriptions s set status='completed',updated_at=now()
 where s.id=v_subscription and s.status='active'
 and not exists(select 1 from public.study_session_attendance a where a.subscription_id=s.id and a.attendance_status='scheduled')
 and (select count(*) from public.study_session_attendance a where a.subscription_id=s.id and a.attendance_status in ('attended','missed'))>=s.total_sessions
 returning true into v_completed;
 if coalesce(v_completed,false) then
  insert into public.study_session_notifications(student_id,session_id,attendance_id,title,message,notification_type)
  values(v_student,v_session,p_attendance_id,'Package completed','You have used all sessions in this package. Choose a new lesson package to continue learning.','package_completed')
  on conflict(attendance_id,notification_type) do nothing;
 end if;
 return true;
end $$;

create or replace function public.study_cancel_session_attendance()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if new.status='cancelled' and old.status is distinct from new.status then
  update public.study_session_attendance set attendance_status='excused',marked_at=now()
  where session_id=new.id and attendance_status='scheduled';
 end if;
 return new;
end $$;
drop trigger if exists study_cancelled_session_release on public.study_scheduled_sessions;
create trigger study_cancelled_session_release after update of status on public.study_scheduled_sessions for each row execute function public.study_cancel_session_attendance();

alter table public.study_package_catalog enable row level security;
alter table public.study_package_subscriptions enable row level security;
alter table public.study_scheduled_sessions enable row level security;
alter table public.study_session_attendance enable row level security;
alter table public.study_package_payments enable row level security;
alter table public.study_session_notifications enable row level security;

drop policy if exists "Active study packages are visible" on public.study_package_catalog;
create policy "Active study packages are visible" on public.study_package_catalog for select to authenticated using(active);
drop policy if exists "Students view own package subscriptions" on public.study_package_subscriptions;
create policy "Students view own package subscriptions" on public.study_package_subscriptions for select to authenticated
using(student_id=(select auth.uid()) or coalesce((select auth.jwt())->'app_metadata'->>'staff_role','') in ('admin','manager','staff','architect'));
drop policy if exists "Students view assigned scheduled sessions" on public.study_scheduled_sessions;
create policy "Students view assigned scheduled sessions" on public.study_scheduled_sessions for select to authenticated
using(status<>'cancelled' and (coalesce((select auth.jwt())->'app_metadata'->>'staff_role','') in ('admin','manager','staff','architect')
or exists(select 1 from public.study_session_attendance a where a.session_id=study_scheduled_sessions.id and a.student_id=(select auth.uid()))));
drop policy if exists "Staff create scheduled study sessions" on public.study_scheduled_sessions;
create policy "Staff create scheduled study sessions" on public.study_scheduled_sessions for insert to authenticated
with check(coalesce((select auth.jwt())->'app_metadata'->>'staff_role','') in ('admin','manager','staff','architect') and created_by=(select auth.uid()));
drop policy if exists "Staff update scheduled study sessions" on public.study_scheduled_sessions;
create policy "Staff update scheduled study sessions" on public.study_scheduled_sessions for update to authenticated
using(coalesce((select auth.jwt())->'app_metadata'->>'staff_role','') in ('admin','manager','staff','architect'))
with check(coalesce((select auth.jwt())->'app_metadata'->>'staff_role','') in ('admin','manager','staff','architect'));
drop policy if exists "Students view own attendance" on public.study_session_attendance;
create policy "Students view own attendance" on public.study_session_attendance for select to authenticated
using(student_id=(select auth.uid()) or coalesce((select auth.jwt())->'app_metadata'->>'staff_role','') in ('admin','manager','staff','architect'));
drop policy if exists "Students view own study notifications" on public.study_session_notifications;
create policy "Students view own study notifications" on public.study_session_notifications for select to authenticated
using(student_id=(select auth.uid()) or coalesce((select auth.jwt())->'app_metadata'->>'staff_role','') in ('admin','manager','staff','architect'));
drop policy if exists "Students mark own notifications read" on public.study_session_notifications;
create policy "Students mark own notifications read" on public.study_session_notifications for update to authenticated
using(student_id=(select auth.uid())) with check(student_id=(select auth.uid()));
drop policy if exists "Students and staff view package payments" on public.study_package_payments;
create policy "Students and staff view package payments" on public.study_package_payments for select to authenticated
using(student_id=(select auth.uid()) or coalesce((select auth.jwt())->'app_metadata'->>'staff_role','') in ('admin','manager','staff','architect'));

grant select on public.study_package_catalog,public.study_package_subscriptions,public.study_scheduled_sessions,public.study_session_attendance,public.study_session_notifications,public.study_package_payments to authenticated;
revoke all on function public.acknowledge_study_session(uuid) from public,anon;
revoke all on function public.mark_study_attendance(uuid,text) from public,anon;
grant execute on function public.acknowledge_study_session(uuid) to authenticated;
grant execute on function public.mark_study_attendance(uuid,text) to authenticated;
revoke all on function public.study_schedule_session_for_active_students() from public,anon,authenticated;
revoke all on function public.study_cancel_session_attendance() from public,anon,authenticated;
