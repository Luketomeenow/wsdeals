-- Create storage bucket for deal attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deal-attachments', 'deal-attachments', false);

-- Create policies for deal attachments bucket
CREATE POLICY "Users can view their own deal attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'deal-attachments');

CREATE POLICY "Users can upload deal attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'deal-attachments');

CREATE POLICY "Users can update their own deal attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'deal-attachments');

CREATE POLICY "Users can delete their own deal attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'deal-attachments');