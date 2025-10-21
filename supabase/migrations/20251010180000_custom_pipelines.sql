-- Add new stage values to deal_stage_enum
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'uncontacted';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'dm connected';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'bizops audit agreement sent';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'bizops audit paid / booked';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'bizops audit attended';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'ms agreement sent';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'balance paid / deal won';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'not qualified';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'onboarding call booked';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'onboarding call attended';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'active client (operator)';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'active client - project in progress';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'paused client';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'candidate replacement';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'project rescope / expansion';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'active client - project maintenance';
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'cancelled / completed';

-- Update pipelines table to include stage definitions
ALTER TABLE public.pipelines ADD COLUMN IF NOT EXISTS stage_order jsonb DEFAULT '[]';

-- Insert Outbound Funnel Pipeline
INSERT INTO public.pipelines (id, name, description, stages, is_active, stage_order)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Outbound Funnel',
  'Sales pipeline for outbound prospecting and closing deals',
  '[
    "uncontacted",
    "no answer / gatekeeper",
    "dm connected",
    "strategy call booked",
    "strategy call attended",
    "bizops audit agreement sent",
    "bizops audit paid / booked",
    "bizops audit attended",
    "ms agreement sent",
    "balance paid / deal won",
    "not interested",
    "not qualified"
  ]'::jsonb,
  true,
  '[
    {"name": "Uncontacted", "color": "#9CA3AF"},
    {"name": "No Answer / Gatekeeper", "color": "#9CA3AF"},
    {"name": "DM Connected", "color": "#F59E0B"},
    {"name": "Strategy Call Booked", "color": "#3B82F6"},
    {"name": "Strategy Call Attended", "color": "#3B82F6"},
    {"name": "BizOps Audit Agreement Sent", "color": "#8B5CF6"},
    {"name": "BizOps Audit Paid / Booked", "color": "#8B5CF6"},
    {"name": "BizOps Audit Attended", "color": "#8B5CF6"},
    {"name": "MS Agreement Sent", "color": "#10B981"},
    {"name": "Balance Paid / Deal Won", "color": "#10B981"},
    {"name": "Not Interested", "color": "#EF4444"},
    {"name": "Not Qualified", "color": "#EF4444"}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  stages = EXCLUDED.stages,
  stage_order = EXCLUDED.stage_order;

-- Insert Client Success Pipeline
INSERT INTO public.pipelines (id, name, description, stages, is_active, stage_order)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Client Success Pipeline',
  'Pipeline for managing active clients and post-sale success',
  '[
    "onboarding call booked",
    "onboarding call attended",
    "active client (operator)",
    "active client - project in progress",
    "paused client",
    "candidate replacement",
    "project rescope / expansion",
    "active client - project maintenance",
    "cancelled / completed"
  ]'::jsonb,
  true,
  '[
    {"name": "Onboarding Call Booked", "color": "#3B82F6"},
    {"name": "Onboarding Call Attended", "color": "#3B82F6"},
    {"name": "Active Client (Operator)", "color": "#10B981"},
    {"name": "Active Client - Project in Progress", "color": "#10B981"},
    {"name": "Paused Client", "color": "#F59E0B"},
    {"name": "Candidate Replacement", "color": "#F59E0B"},
    {"name": "Project Rescope / Expansion", "color": "#8B5CF6"},
    {"name": "Active Client - Project Maintenance", "color": "#10B981"},
    {"name": "Cancelled / Completed", "color": "#6B7280"}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  stages = EXCLUDED.stages,
  stage_order = EXCLUDED.stage_order;

-- Set default pipeline for existing deals without a pipeline_id
UPDATE public.deals 
SET pipeline_id = '00000000-0000-0000-0000-000000000001'
WHERE pipeline_id IS NULL;

