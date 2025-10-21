-- Add indexes for better query performance across the app

-- Enable pg_trgm extension for fuzzy text search (must be first)
create extension if not exists pg_trgm;

-- Deals table indexes
create index if not exists idx_deals_stage on public.deals(stage);
create index if not exists idx_deals_priority on public.deals(priority);
create index if not exists idx_deals_created_at on public.deals(created_at desc);
create index if not exists idx_deals_close_date on public.deals(close_date);
create index if not exists idx_deals_company_id on public.deals(company_id);
create index if not exists idx_deals_primary_contact on public.deals(primary_contact_id);
create index if not exists idx_deals_amount on public.deals(amount);

-- Contacts table indexes
create index if not exists idx_contacts_email on public.contacts(email);
create index if not exists idx_contacts_company on public.contacts(company_id);
create index if not exists idx_contacts_created_at on public.contacts(created_at desc);
create index if not exists idx_contacts_name on public.contacts(first_name, last_name);

-- Companies table indexes
create index if not exists idx_companies_name on public.companies(name);
create index if not exists idx_companies_created_at on public.companies(created_at desc);

-- Calls table indexes
create index if not exists idx_calls_created_at on public.calls(created_at desc);
create index if not exists idx_calls_contact on public.calls(related_contact_id);
create index if not exists idx_calls_deal on public.calls(related_deal_id);
create index if not exists idx_calls_user on public.calls(rep_id);
create index if not exists idx_calls_outcome on public.calls(call_outcome);

-- SMS Messages indexes
create index if not exists idx_sms_created_at on public.sms_messages(created_at desc);
create index if not exists idx_sms_contact on public.sms_messages(contact_id);

-- Tasks table indexes
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_deal on public.tasks(deal_id);
create index if not exists idx_tasks_contact on public.tasks(contact_id);

-- User profiles indexes
create index if not exists idx_user_profiles_email on public.user_profiles(email);

-- Composite indexes for common queries
create index if not exists idx_deals_stage_priority on public.deals(stage, priority);
create index if not exists idx_calls_user_created on public.calls(rep_id, created_at desc);
create index if not exists idx_tasks_assigned_status on public.tasks(assigned_to, status);

-- Full-text search indexes for better search performance
create index if not exists idx_deals_name_trgm on public.deals using gin(name gin_trgm_ops);
create index if not exists idx_companies_name_trgm on public.companies using gin(name gin_trgm_ops);
create index if not exists idx_contacts_first_name_trgm on public.contacts using gin(first_name gin_trgm_ops);
create index if not exists idx_contacts_last_name_trgm on public.contacts using gin(last_name gin_trgm_ops);
