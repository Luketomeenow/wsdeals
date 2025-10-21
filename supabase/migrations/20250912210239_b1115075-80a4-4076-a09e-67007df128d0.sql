-- Create enum types for call tracking
CREATE TYPE outbound_type_enum AS ENUM (
  'outbound call',
  'inbound call', 
  'strategy call',
  'scope call',
  'candidate interview',
  'onboarding call'
);

CREATE TYPE call_outcome_enum AS ENUM (
  'do not call',
  'dash',
  'asked to be put on DNC list',
  'did not dial',
  'phone did not ring',
  'no answer',
  'gatekeeper',
  'voicemail',
  'DM',
  'introduction',
  'sensor decision maker',
  'DM short story',
  'DM discovery',
  'DM presentation',
  'DM resume request',
  'strategy call booked',
  'strategy call attended',
  'strategy call no show',
  'candidate interview booked',
  'candidate interview attended',
  'not interested',
  'no show',
  'onboarding call booked',
  'onboarding call attended',
  'nurturing'
);

CREATE TYPE deal_stage_enum AS ENUM (
  'not contacted',
  'no answer / gatekeeper',
  'decision maker',
  'nurturing',
  'interested',
  'strategy call booked',
  'strategy call attended',
  'proposal / scope',
  'closed won',
  'closed lost'
);

CREATE TYPE lifecycle_stage_enum AS ENUM (
  'lead',
  'prospect',
  'qualified',
  'customer',
  'evangelist'
);

-- Create companies table
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  company_id UUID REFERENCES public.companies(id),
  owner_id UUID,
  timezone TEXT DEFAULT 'UTC',
  lifecycle_stage lifecycle_stage_enum DEFAULT 'lead',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deals table
CREATE TABLE public.deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stage deal_stage_enum DEFAULT 'not contacted',
  owner_id UUID,
  amount DECIMAL(15,2),
  close_date DATE,
  company_id UUID REFERENCES public.companies(id),
  primary_contact_id UUID REFERENCES public.contacts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calls table
CREATE TABLE public.calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  related_deal_id UUID REFERENCES public.deals(id),
  related_contact_id UUID REFERENCES public.contacts(id),
  related_company_id UUID REFERENCES public.companies(id),
  outbound_type outbound_type_enum NOT NULL,
  call_outcome call_outcome_enum NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  notes TEXT,
  call_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rep_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies
CREATE POLICY "Users can view all companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Users can create companies" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update companies" ON public.companies FOR UPDATE USING (true);
CREATE POLICY "Users can delete companies" ON public.companies FOR DELETE USING (true);

-- Create RLS policies for contacts
CREATE POLICY "Users can view all contacts" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Users can create contacts" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update contacts" ON public.contacts FOR UPDATE USING (true);
CREATE POLICY "Users can delete contacts" ON public.contacts FOR DELETE USING (true);

-- Create RLS policies for deals
CREATE POLICY "Users can view all deals" ON public.deals FOR SELECT USING (true);
CREATE POLICY "Users can create deals" ON public.deals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update deals" ON public.deals FOR UPDATE USING (true);
CREATE POLICY "Users can delete deals" ON public.deals FOR DELETE USING (true);

-- Create RLS policies for calls
CREATE POLICY "Users can view all calls" ON public.calls FOR SELECT USING (true);
CREATE POLICY "Users can create calls" ON public.calls FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update calls" ON public.calls FOR UPDATE USING (true);
CREATE POLICY "Users can delete calls" ON public.calls FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX idx_deals_company_id ON public.deals(company_id);
CREATE INDEX idx_deals_primary_contact_id ON public.deals(primary_contact_id);
CREATE INDEX idx_calls_related_deal_id ON public.calls(related_deal_id);
CREATE INDEX idx_calls_related_contact_id ON public.calls(related_contact_id);
CREATE INDEX idx_calls_related_company_id ON public.calls(related_company_id);
CREATE INDEX idx_calls_timestamp ON public.calls(call_timestamp);
CREATE INDEX idx_calls_rep_id ON public.calls(rep_id);
CREATE INDEX idx_calls_call_outcome ON public.calls(call_outcome);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON public.calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();