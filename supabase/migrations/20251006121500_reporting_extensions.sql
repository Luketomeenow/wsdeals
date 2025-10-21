-- Reporting enhancements: qualification, proposal/audit/invoice markers,
-- product category, and additional call outcomes for analytics

-- 1) Deal qualification status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'qualification_status_enum'
  ) THEN
    CREATE TYPE public.qualification_status_enum AS ENUM ('sql', 'nql', 'unknown');
  END IF;
END $$;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS qualification_status public.qualification_status_enum NULL;

-- 2) Deal lifecycle timestamps for reporting
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS proposal_sent_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS business_audit_booked_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS business_audit_attended_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS invoice_agreement_sent_at timestamptz NULL;

-- 3) Primary product category on the deal (summary; detailed items still in line_items)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'product_category_enum'
  ) THEN
    CREATE TYPE public.product_category_enum AS ENUM ('VA', 'SMM', 'Web', 'Webapp', 'AI Adoption', 'Other');
  END IF;
END $$;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS primary_product_category public.product_category_enum NULL;

-- 6) Deal vertical and timezone on deals
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'deal_vertical_enum'
  ) THEN
    CREATE TYPE public.deal_vertical_enum AS ENUM (
      'Real Estate', 'Dentals', 'Legal', 'Professional Services',
      'Accounting & Bookkeeping Firms', 'Financial Advisors / Wealth Management', 'Mortgage Brokers',
      'Consulting Firms (Business / Management / HR)', 'Recruiting & Staffing Agencies', 'Architecture Firms',
      'Engineering Firms', 'Property Management Companies',
      'Web Design & Development Agencies', 'Video Production Studios', 'E-commerce Brands / Shopify Stores',
      'Influencers & Personal Brands', 'Podcast Production Companies', 'PR & Communications Agencies',
      'Graphic Design / Branding Studios',
      'Medical Clinics (Private Practices)', 'Chiropractors', 'Physical Therapy Clinics', 'Nutritionists & Dietitians',
      'Mental Health Therapists / Coaches', 'Medical Billing Companies',
      'Cleaning Companies', 'HVAC / Plumbing / Electrical Contractors', 'Landscaping / Lawn Care Companies',
      'Construction & Renovation Firms', 'Pest Control Companies',
      'Online Course Creators / EdTech', 'Life Coaches & Business Coaches', 'Tutoring & Test Prep Centers',
      'Freight Brokerage / Dispatch Services', 'Wholesale & Distribution Companies', 'Automotive Dealerships or Brokers',
      'Other'
    );
  END IF;
END $$;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS vertical public.deal_vertical_enum NULL,
  ADD COLUMN IF NOT EXISTS timezone text NULL,
  ADD COLUMN IF NOT EXISTS source text NULL;

CREATE INDEX IF NOT EXISTS deals_vertical_idx ON public.deals (vertical);

-- 4) Extend call outcomes to support additional closing/ops signals
DO $$ BEGIN
  -- Use ADD VALUE IF NOT EXISTS to avoid errors on re-run
  BEGIN
    ALTER TYPE public.call_outcome_enum ADD VALUE IF NOT EXISTS 'SQL';
    ALTER TYPE public.call_outcome_enum ADD VALUE IF NOT EXISTS 'NQL';
    ALTER TYPE public.call_outcome_enum ADD VALUE IF NOT EXISTS 'business audit booked';
    ALTER TYPE public.call_outcome_enum ADD VALUE IF NOT EXISTS 'business audit attended';
    ALTER TYPE public.call_outcome_enum ADD VALUE IF NOT EXISTS 'invoice sent';
    ALTER TYPE public.call_outcome_enum ADD VALUE IF NOT EXISTS 'agreement sent';
  EXCEPTION WHEN others THEN
    -- Ignore if already added or ordering conflict
    NULL;
  END;
END $$;

-- 5) Helpful indexes for reporting (safe if created multiple times)
CREATE INDEX IF NOT EXISTS deals_qualification_status_idx ON public.deals (qualification_status);
CREATE INDEX IF NOT EXISTS deals_primary_product_category_idx ON public.deals (primary_product_category);
CREATE INDEX IF NOT EXISTS deals_proposal_sent_at_idx ON public.deals (proposal_sent_at);
CREATE INDEX IF NOT EXISTS deals_business_audit_booked_at_idx ON public.deals (business_audit_booked_at);
CREATE INDEX IF NOT EXISTS deals_business_audit_attended_at_idx ON public.deals (business_audit_attended_at);
CREATE INDEX IF NOT EXISTS deals_invoice_agreement_sent_at_idx ON public.deals (invoice_agreement_sent_at);


