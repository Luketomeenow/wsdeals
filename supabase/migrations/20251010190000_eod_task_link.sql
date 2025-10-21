-- Add task_link column to eod_time_entries table
alter table public.eod_time_entries
add column if not exists task_link text;

-- Remove task_id column if it exists (replacing with task_link)
-- Note: This is safe because we're changing from task reference to manual URL
alter table public.eod_time_entries
drop column if exists task_id;

-- Add comment
comment on column public.eod_time_entries.task_link is 'URL link to related task or project';

