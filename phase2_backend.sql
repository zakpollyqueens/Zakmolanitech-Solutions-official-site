-- ============================================================
-- ZAKMOLANITECH SOLUTIONS
-- PHASE 2 — CONTACT + SERVICE REQUEST BACKEND
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- CONTACT MESSAGES
-- ============================================================

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  subject text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SERVICE REQUESTS
-- ============================================================

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  service text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists contact_messages_created_at_idx
on public.contact_messages(created_at desc);

create index if not exists contact_messages_status_idx
on public.contact_messages(status);

create index if not exists service_requests_created_at_idx
on public.service_requests(created_at desc);

create index if not exists service_requests_status_idx
on public.service_requests(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.contact_messages enable row level security;
alter table public.service_requests enable row level security;

-- ============================================================
-- PUBLIC INSERT POLICIES
-- These allow the public website forms to submit records.
-- ============================================================

drop policy if exists "Public can submit contact messages"
on public.contact_messages;

create policy "Public can submit contact messages"
on public.contact_messages
for insert
to anon, authenticated
with check (
  length(trim(name)) between 1 and 150
  and length(trim(message)) between 1 and 5000
);

drop policy if exists "Public can submit service requests"
on public.service_requests;

create policy "Public can submit service requests"
on public.service_requests
for insert
to anon, authenticated
with check (
  length(trim(name)) between 1 and 150
  and length(trim(service)) between 1 and 150
  and length(trim(message)) between 1 and 5000
);

-- ============================================================
-- ADMIN POLICIES
-- Uses the existing is_admin() RPC/function.
-- ============================================================

drop policy if exists "Admins can view contact messages"
on public.contact_messages;

create policy "Admins can view contact messages"
on public.contact_messages
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update contact messages"
on public.contact_messages;

create policy "Admins can update contact messages"
on public.contact_messages
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete contact messages"
on public.contact_messages;

create policy "Admins can delete contact messages"
on public.contact_messages
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view service requests"
on public.service_requests;

create policy "Admins can view service requests"
on public.service_requests
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update service requests"
on public.service_requests;

create policy "Admins can update service requests"
on public.service_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete service requests"
on public.service_requests;

create policy "Admins can delete service requests"
on public.service_requests
for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- GRANTS
-- ============================================================

grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;

grant insert on public.service_requests to anon, authenticated;
grant select, update, delete on public.service_requests to authenticated;

-- ============================================================
-- DONE
-- ============================================================
