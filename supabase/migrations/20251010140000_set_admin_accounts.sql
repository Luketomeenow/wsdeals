-- Set specific accounts as admin (if they already exist)
update public.user_profiles 
set role = 'admin'
where email in ('lukejason05@gmail.com', 'admin@stafflyhq.ai');

-- Add a trigger to auto-set admin role for these emails on profile creation
create or replace function public.set_admin_role_on_profile_insert()
returns trigger as $$
begin
  if new.email in ('lukejason05@gmail.com', 'admin@stafflyhq.ai') then
    new.role := 'admin';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_admin_role_trigger on public.user_profiles;
create trigger set_admin_role_trigger
  before insert on public.user_profiles
  for each row
  execute function public.set_admin_role_on_profile_insert();

-- Also check for existing auth users and create profiles if missing
do $$
declare
  admin_user record;
begin
  for admin_user in 
    select id, email 
    from auth.users 
    where email in ('lukejason05@gmail.com', 'admin@stafflyhq.ai')
  loop
    insert into public.user_profiles (user_id, email, role, is_active)
    values (admin_user.id, admin_user.email, 'admin', true)
    on conflict (user_id) do update
    set role = 'admin', email = admin_user.email;
  end loop;
end $$;
