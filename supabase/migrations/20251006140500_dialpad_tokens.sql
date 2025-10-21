create table if not exists public.dialpad_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dialpad_user_id text,
  access_token text not null,
  refresh_token text not null,
  token_type text,
  scope text,
  expires_at timestamptz not null,
  from_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dialpad_tokens_expires_at on public.dialpad_tokens(expires_at);

alter table public.dialpad_tokens enable row level security;

create policy if not exists "dialpad_tokens_select_self"
  on public.dialpad_tokens
  for select
  using (auth.uid() = user_id);

create policy if not exists "dialpad_tokens_insert_self"
  on public.dialpad_tokens
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "dialpad_tokens_update_self"
  on public.dialpad_tokens
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "dialpad_tokens_delete_self"
  on public.dialpad_tokens
  for delete
  using (auth.uid() = user_id);



