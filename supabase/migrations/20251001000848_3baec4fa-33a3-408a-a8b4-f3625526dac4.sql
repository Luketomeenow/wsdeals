-- Extend calls table with Dialpad-specific fields
ALTER TABLE public.calls
ADD COLUMN IF NOT EXISTS dialpad_call_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS dialpad_contact_id TEXT,
ADD COLUMN IF NOT EXISTS call_direction TEXT CHECK (call_direction IN ('inbound', 'outbound')),
ADD COLUMN IF NOT EXISTS caller_number TEXT,
ADD COLUMN IF NOT EXISTS callee_number TEXT,
ADD COLUMN IF NOT EXISTS call_status TEXT DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS dialpad_metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for faster lookups by Dialpad call ID
CREATE INDEX IF NOT EXISTS idx_calls_dialpad_call_id ON public.calls(dialpad_call_id);

-- Create index for call direction filtering
CREATE INDEX IF NOT EXISTS idx_calls_direction ON public.calls(call_direction);

-- Create webhooks table to track Dialpad webhook events
CREATE TABLE IF NOT EXISTS public.dialpad_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_id TEXT UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on webhooks table
ALTER TABLE public.dialpad_webhooks ENABLE ROW LEVEL SECURITY;

-- Create policies for webhooks
CREATE POLICY "Users can view all webhooks"
  ON public.dialpad_webhooks
  FOR SELECT
  USING (true);

-- Create index for webhook processing
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON public.dialpad_webhooks(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_event_id ON public.dialpad_webhooks(event_id);