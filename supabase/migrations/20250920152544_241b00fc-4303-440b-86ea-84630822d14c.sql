-- Create new enums
CREATE TYPE public.priority_enum AS ENUM ('high', 'medium', 'low');
CREATE TYPE public.task_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE public.email_status_enum AS ENUM ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');
CREATE TYPE public.meeting_type_enum AS ENUM ('strategy_call', 'candidate_interview', 'onboarding', 'consultation', 'demo', 'follow_up', 'closing');
CREATE TYPE public.deal_status_enum AS ENUM ('open', 'won', 'lost', 'on_hold');
CREATE TYPE public.attachment_type_enum AS ENUM ('image', 'document', 'invoice', 'contract', 'proposal', 'other');

-- Create pipelines table
CREATE TABLE public.pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  stages JSONB NOT NULL DEFAULT '[]', -- Array of stage objects {name, position, color}
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_profiles table for rep management
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE, -- References auth.users
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'rep',
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.user_profiles(id),
  created_by UUID REFERENCES public.user_profiles(id),
  status public.task_status_enum NOT NULL DEFAULT 'pending',
  priority public.priority_enum NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_queues table
CREATE TABLE public.task_queues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.user_profiles(id),
  task_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create emails table
CREATE TABLE public.emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  sent_by UUID REFERENCES public.user_profiles(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  status public.email_status_enum NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  email_provider_id TEXT, -- For tracking with Gmail/other providers
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  scheduled_by UUID REFERENCES public.user_profiles(id),
  meeting_type public.meeting_type_enum NOT NULL DEFAULT 'consultation',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  is_booked BOOLEAN NOT NULL DEFAULT true,
  is_attended BOOLEAN DEFAULT false,
  meeting_link TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attachments table
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.user_profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type public.attachment_type_enum NOT NULL DEFAULT 'other',
  mime_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create line_items table
CREATE TABLE public.line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Extend existing tables

-- Add columns to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS employees_count INTEGER;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add columns to contacts table
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS secondary_phone TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE;

-- Add columns to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS priority public.priority_enum NOT NULL DEFAULT 'medium';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS deal_status public.deal_status_enum NOT NULL DEFAULT 'open';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS income_amount NUMERIC(15,2);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS account_manager UUID REFERENCES public.user_profiles(id);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS account_executive UUID REFERENCES public.user_profiles(id);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS appointment_setter UUID REFERENCES public.user_profiles(id);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS referral TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS contact_attempts INTEGER DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS source TEXT;

-- Enable RLS on all new tables
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all new tables (allowing all operations for now)
-- Pipelines policies
CREATE POLICY "Users can view all pipelines" ON public.pipelines FOR SELECT USING (true);
CREATE POLICY "Users can create pipelines" ON public.pipelines FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update pipelines" ON public.pipelines FOR UPDATE USING (true);
CREATE POLICY "Users can delete pipelines" ON public.pipelines FOR DELETE USING (true);

-- User profiles policies
CREATE POLICY "Users can view all profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can create profiles" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update profiles" ON public.user_profiles FOR UPDATE USING (true);
CREATE POLICY "Users can delete profiles" ON public.user_profiles FOR DELETE USING (true);

-- Tasks policies
CREATE POLICY "Users can view all tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Users can delete tasks" ON public.tasks FOR DELETE USING (true);

-- Task queues policies
CREATE POLICY "Users can view all task queues" ON public.task_queues FOR SELECT USING (true);
CREATE POLICY "Users can create task queues" ON public.task_queues FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update task queues" ON public.task_queues FOR UPDATE USING (true);
CREATE POLICY "Users can delete task queues" ON public.task_queues FOR DELETE USING (true);

-- Emails policies
CREATE POLICY "Users can view all emails" ON public.emails FOR SELECT USING (true);
CREATE POLICY "Users can create emails" ON public.emails FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update emails" ON public.emails FOR UPDATE USING (true);
CREATE POLICY "Users can delete emails" ON public.emails FOR DELETE USING (true);

-- Meetings policies
CREATE POLICY "Users can view all meetings" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Users can create meetings" ON public.meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update meetings" ON public.meetings FOR UPDATE USING (true);
CREATE POLICY "Users can delete meetings" ON public.meetings FOR DELETE USING (true);

-- Attachments policies
CREATE POLICY "Users can view all attachments" ON public.attachments FOR SELECT USING (true);
CREATE POLICY "Users can create attachments" ON public.attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update attachments" ON public.attachments FOR UPDATE USING (true);
CREATE POLICY "Users can delete attachments" ON public.attachments FOR DELETE USING (true);

-- Line items policies
CREATE POLICY "Users can view all line items" ON public.line_items FOR SELECT USING (true);
CREATE POLICY "Users can create line items" ON public.line_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update line items" ON public.line_items FOR UPDATE USING (true);
CREATE POLICY "Users can delete line items" ON public.line_items FOR DELETE USING (true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON public.pipelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_queues_updated_at
  BEFORE UPDATE ON public.task_queues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emails_updated_at
  BEFORE UPDATE ON public.emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attachments_updated_at
  BEFORE UPDATE ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_line_items_updated_at
  BEFORE UPDATE ON public.line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pipeline
INSERT INTO public.pipelines (name, description, stages) VALUES 
('Lead Generation Pipeline', 'Default sales pipeline for lead generation', 
'[
  {"name": "Not Contacted", "position": 0, "color": "#gray"},
  {"name": "Attempted Contact", "position": 1, "color": "#yellow"},
  {"name": "Connected", "position": 2, "color": "#blue"},
  {"name": "Qualified", "position": 3, "color": "#purple"},
  {"name": "Consultation Scheduled", "position": 4, "color": "#orange"},
  {"name": "Proposal Sent", "position": 5, "color": "#green"},
  {"name": "Negotiation", "position": 6, "color": "#red"},
  {"name": "Closed Won", "position": 7, "color": "#emerald"},
  {"name": "Closed Lost", "position": 8, "color": "#slate"}
]'::jsonb);

-- Create indexes for better performance
CREATE INDEX idx_deals_pipeline_id ON public.deals(pipeline_id);
CREATE INDEX idx_deals_priority ON public.deals(priority);
CREATE INDEX idx_deals_deal_status ON public.deals(deal_status);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_emails_contact_id ON public.emails(contact_id);
CREATE INDEX idx_emails_status ON public.emails(status);
CREATE INDEX idx_meetings_scheduled_at ON public.meetings(scheduled_at);
CREATE INDEX idx_meetings_contact_id ON public.meetings(contact_id);