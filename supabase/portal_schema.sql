-- Run this in your Supabase SQL editor at:
-- https://app.supabase.com → SQL Editor → New Query

-- Portal quote requests submitted by clients
create table if not exists public.portal_quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_email text not null,
  client_name text,
  file_name text,
  file_url text,
  plate_width numeric,
  plate_height numeric,
  cut_length numeric,
  pierce_count integer,
  holes jsonb,
  material text,
  thickness text,
  qty integer default 1,
  notes text,
  status text not null default 'pending',  -- pending | reviewed | quoted | rejected
  staff_notes text
);

-- Allow clients to insert their own rows (anon key is fine for portal)
alter table public.portal_quotes enable row level security;

create policy "clients can insert" on public.portal_quotes
  for insert with check (true);

create policy "clients can view own" on public.portal_quotes
  for select using (client_email = current_setting('request.jwt.claims', true)::json->>'email');

create policy "service can do all" on public.portal_quotes
  using (true) with check (true);

-- Storage bucket for DXF files (run separately in Supabase Storage settings)
-- Bucket name: dxf-uploads  (public: false)
