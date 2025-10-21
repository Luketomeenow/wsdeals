# Admin Account Setup

## Problem
Your accounts `lukejason05@gmail.com` and `admin@stafflyhq.ai` can't access the CRM because they need to be set as admin in the `user_profiles` table.

## Solution

### Step 1: Run this SQL in Supabase SQL Editor

Go to your Supabase project → SQL Editor → New query, and run:

```sql
-- First, check if your auth users exist
SELECT id, email FROM auth.users WHERE email IN ('lukejason05@gmail.com', 'admin@stafflyhq.ai');

-- Create or update user_profiles for these accounts
INSERT INTO public.user_profiles (user_id, email, role, is_active, first_name, last_name)
SELECT 
  u.id, 
  u.email, 
  'admin', 
  true,
  split_part(u.email, '@', 1), -- temporary first name from email
  'Admin' -- temporary last name
FROM auth.users u
WHERE u.email IN ('lukejason05@gmail.com', 'admin@stafflyhq.ai')
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin', 
    email = EXCLUDED.email,
    is_active = true;

-- Verify the setup
SELECT 
  up.id,
  up.user_id,
  up.email,
  up.role,
  up.is_active
FROM public.user_profiles up
WHERE up.email IN ('lukejason05@gmail.com', 'admin@stafflyhq.ai');
```

### Step 2: If you haven't signed up yet

1. Go to your app: `https://dealdashai.netlify.app/login`
2. Sign up with `lukejason05@gmail.com` or `admin@stafflyhq.ai`
3. After signup, the trigger will automatically set your role to `admin`
4. Refresh the page and you'll have full CRM access

### Step 3: If you already signed up but still can't access

Run this SQL to fix it:

```sql
-- Force update to admin
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email IN ('lukejason05@gmail.com', 'admin@stafflyhq.ai');
```

Then:
1. Log out from the app
2. Log back in
3. You should now have full access

## How to Check if it Worked

After running the SQL, verify with:

```sql
SELECT 
  u.email,
  up.role,
  up.is_active
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email IN ('lukejason05@gmail.com', 'admin@stafflyhq.ai');
```

You should see:
- email: lukejason05@gmail.com, role: admin, is_active: true
- email: admin@stafflyhq.ai, role: admin, is_active: true

## What the Migration Does

The migration `20251010140000_set_admin_accounts.sql`:
1. Sets existing profiles to admin
2. Creates a trigger for future signups
3. Automatically creates profiles for auth users that are missing

## Troubleshooting

### Still redirecting to EOD?
1. Clear browser cache and cookies
2. Log out completely
3. Log back in
4. Check browser console for errors

### Role not updating?
Run:
```sql
DELETE FROM public.user_profiles WHERE email IN ('lukejason05@gmail.com', 'admin@stafflyhq.ai');
```
Then sign up again - the trigger will set you as admin automatically.

