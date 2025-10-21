-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule automatic Dialpad sync every hour
SELECT cron.schedule(
  'dialpad-hourly-sync',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url:='https://qzxuhefnyskdtdfrcrtg.supabase.co/functions/v1/dialpad-sync',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6eHVoZWZueXNrZHRkZnJjcnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDkwNjMsImV4cCI6MjA3MzI4NTA2M30.bWxU18LllaPPksIDSPsuHaj785EVWHcoEZj8jfLFoXQ"}'::jsonb,
      body:='{"limit": 100, "start_time": "2024-01-01T00:00:00Z"}'::jsonb
    ) as request_id;
  $$
);

-- Create table for call analytics
CREATE TABLE IF NOT EXISTS public.call_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE,
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  key_topics TEXT[],
  action_items TEXT[],
  call_quality_score INTEGER CHECK (call_quality_score >= 0 AND call_quality_score <= 100),
  talk_time_ratio DECIMAL(3,2), -- Rep talk time vs customer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all call analytics"
  ON public.call_analytics
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create call analytics"
  ON public.call_analytics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update call analytics"
  ON public.call_analytics
  FOR UPDATE
  USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_call_analytics_call_id ON public.call_analytics(call_id);
CREATE INDEX IF NOT EXISTS idx_call_analytics_sentiment ON public.call_analytics(sentiment_label);

-- Create table for SMS messages
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dialpad_message_id TEXT UNIQUE,
  contact_id UUID REFERENCES public.contacts(id),
  deal_id UUID REFERENCES public.deals(id),
  company_id UUID REFERENCES public.companies(id),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all SMS messages"
  ON public.sms_messages
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create SMS messages"
  ON public.sms_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update SMS messages"
  ON public.sms_messages
  FOR UPDATE
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sms_contact_id ON public.sms_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_sms_deal_id ON public.sms_messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_sms_sent_at ON public.sms_messages(sent_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_call_analytics_updated_at
BEFORE UPDATE ON public.call_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sms_messages_updated_at
BEFORE UPDATE ON public.sms_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();