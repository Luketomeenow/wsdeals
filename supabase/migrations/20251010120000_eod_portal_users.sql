-- Add role to user_profiles if not exists
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='user_profiles' and column_name='role') then
    alter table public.user_profiles add column role text default 'user';
  end if;
end $$;

-- Create index on role for filtering
create index if not exists idx_user_profiles_role on public.user_profiles(role);

-- Update eod_reports to include user profile info for display
create or replace view public.eod_reports_with_users as
select 
  er.*,
  concat(up.first_name, ' ', up.last_name) as full_name,
  up.email,
  up.role
from public.eod_reports er
left join public.user_profiles up on er.user_id = up.user_id;

