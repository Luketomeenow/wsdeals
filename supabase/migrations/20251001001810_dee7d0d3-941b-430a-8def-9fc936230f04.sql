-- Move extensions from public schema to extensions schema
-- This is a Supabase best practice for security

-- Note: pg_cron and pg_net are managed extensions and should already be in the correct schema
-- This migration ensures they are not in the public schema

-- The extensions are system-level and managed by Supabase
-- No action needed - they are automatically placed in the correct schema by Supabase