-- Create a database function to create EOD users (admin only)
-- This bypasses the need for edge functions
create or replace function public.create_eod_user_simple(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_role text default 'eod_user'
)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_result json;
begin
  -- Check if caller is admin
  if not exists (
    select 1 from public.user_profiles 
    where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Only admins can create EOD users';
  end if;

  -- Check if user already exists in auth.users
  select id into v_user_id
  from auth.users
  where email = p_email;

  if v_user_id is not null then
    -- User exists in auth, just create/update profile
    insert into public.user_profiles (user_id, email, first_name, last_name, role, is_active)
    values (v_user_id, p_email, p_first_name, p_last_name, p_role, true)
    on conflict (user_id) do update
    set first_name = p_first_name,
        last_name = p_last_name,
        role = p_role,
        is_active = true;

    v_result := json_build_object(
      'success', true,
      'message', 'User profile created/updated. User already has auth account.',
      'user_id', v_user_id
    );
  else
    -- User doesn't exist - they need to sign up first
    v_result := json_build_object(
      'success', false,
      'message', 'User must sign up at /eod-login first, then you can assign their role here.',
      'email', p_email
    );
  end if;

  return v_result;
end;
$$;

-- Grant execute permission to authenticated users (function checks admin internally)
grant execute on function public.create_eod_user_simple to authenticated;

