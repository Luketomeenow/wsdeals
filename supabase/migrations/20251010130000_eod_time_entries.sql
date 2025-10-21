-- EOD time entries for tracking client work and tasks
create table if not exists public.eod_time_entries (
  id uuid primary key default gen_random_uuid(),
  eod_id uuid not null references public.eod_reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  task_description text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_eod_time_entries_eod on public.eod_time_entries(eod_id);
create index if not exists idx_eod_time_entries_user on public.eod_time_entries(user_id);

alter table public.eod_time_entries enable row level security;

drop policy if exists "eod_time_entries_select_own" on public.eod_time_entries;
create policy "eod_time_entries_select_own" on public.eod_time_entries 
  for select using (auth.uid() = user_id);

drop policy if exists "eod_time_entries_insert_own" on public.eod_time_entries;
create policy "eod_time_entries_insert_own" on public.eod_time_entries 
  for insert with check (auth.uid() = user_id);

drop policy if exists "eod_time_entries_update_own" on public.eod_time_entries;
create policy "eod_time_entries_update_own" on public.eod_time_entries 
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "eod_time_entries_delete_own" on public.eod_time_entries;
create policy "eod_time_entries_delete_own" on public.eod_time_entries 
  for delete using (auth.uid() = user_id);

