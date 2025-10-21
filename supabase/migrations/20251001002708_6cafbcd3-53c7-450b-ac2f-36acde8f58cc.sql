-- Create notes table for deal notes with proper structure
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'ai_summary', 'call_log'
  source_call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all notes"
  ON public.notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create notes"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update notes"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete notes"
  ON public.notes FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_notes_deal_id ON public.notes(deal_id);
CREATE INDEX idx_notes_contact_id ON public.notes(contact_id);
CREATE INDEX idx_notes_company_id ON public.notes(company_id);
CREATE INDEX idx_notes_source_call_id ON public.notes(source_call_id);

-- Create trigger for updated_at
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();