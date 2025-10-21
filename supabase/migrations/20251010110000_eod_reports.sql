-- EOD reports table
create table if not exists public.eod_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_date date not null default (current_date),
  started_at timestamptz,
  ended_at timestamptz,
  total_minutes integer,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_eod_reports_user_date on public.eod_reports(user_id, report_date);

alter table public.eod_reports enable row level security;

drop policy if exists "eod_select_own" on public.eod_reports;
create policy "eod_select_own" on public.eod_reports for select using (auth.uid() = user_id);

drop policy if exists "eod_insert_own" on public.eod_reports;
create policy "eod_insert_own" on public.eod_reports for insert with check (auth.uid() = user_id);

drop policy if exists "eod_update_own" on public.eod_reports;
create policy "eod_update_own" on public.eod_reports for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "eod_delete_own" on public.eod_reports;
create policy "eod_delete_own" on public.eod_reports for delete using (auth.uid() = user_id);

-- EOD report images
create table if not exists public.eod_report_images (
  id uuid primary key default gen_random_uuid(),
  eod_id uuid not null references public.eod_reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,
  public_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_eod_images_eod on public.eod_report_images(eod_id);

alter table public.eod_report_images enable row level security;

drop policy if exists "eod_images_select_own" on public.eod_report_images;
create policy "eod_images_select_own" on public.eod_report_images for select using (auth.uid() = user_id);

drop policy if exists "eod_images_insert_own" on public.eod_report_images;
create policy "eod_images_insert_own" on public.eod_report_images for insert with check (auth.uid() = user_id);

drop policy if exists "eod_images_delete_own" on public.eod_report_images;
create policy "eod_images_delete_own" on public.eod_report_images for delete using (auth.uid() = user_id);

-- Storage bucket for EOD images
insert into storage.buckets (id, name, public) values ('eod-images', 'eod-images', true)
on conflict (id) do nothing;

-- Allow basic CRUD within eod-images bucket
drop policy if exists "eod_images_bucket_select" on storage.objects;
create policy "eod_images_bucket_select" on storage.objects
for select using (bucket_id = 'eod-images');

drop policy if exists "eod_images_bucket_insert" on storage.objects;
create policy "eod_images_bucket_insert" on storage.objects
for insert with check (bucket_id = 'eod-images');

drop policy if exists "eod_images_bucket_update" on storage.objects;
create policy "eod_images_bucket_update" on storage.objects
for update using (bucket_id = 'eod-images');

drop policy if exists "eod_images_bucket_delete" on storage.objects;
create policy "eod_images_bucket_delete" on storage.objects
for delete using (bucket_id = 'eod-images');


