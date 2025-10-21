-- Job postings and candidate applications

create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text,
  location text,
  employment_type text,
  description text,
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

create table if not exists public.candidate_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.job_postings(id) on delete cascade,
  first_name text,
  last_name text,
  city text,
  mobile_phone text,
  whatsapp text,
  age_range text,
  gender text,
  industry_experience text[],
  desired_industries text[],
  desired_roles text[],
  top_preferences text[],
  resume_url text,
  portfolio_links text[],
  temperament_result jsonb,
  role_validation_level text,
  communication_style text,
  behavioral_stress jsonb,
  internet_speed_screenshot_url text,
  workspace_photo_url text,
  tech_stack jsonb, -- { industry: string, tools: [{ name, level: 'B'|'I'|'A' }] }
  created_at timestamptz not null default now()
);

create index if not exists idx_candidate_job on public.candidate_applications(job_id);


