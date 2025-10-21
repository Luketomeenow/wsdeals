-- Ensure the deal_stage_enum includes 'not interested' to match pipeline stages
ALTER TYPE deal_stage_enum ADD VALUE IF NOT EXISTS 'not interested';


