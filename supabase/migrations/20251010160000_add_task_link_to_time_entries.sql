-- Add task_id column to time entries for linking tasks
alter table public.eod_time_entries 
add column if not exists task_id uuid references public.tasks(id) on delete set null;

create index if not exists idx_eod_time_entries_task on public.eod_time_entries(task_id);

