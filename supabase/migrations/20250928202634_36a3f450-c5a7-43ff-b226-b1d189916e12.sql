-- Make the deal-attachments bucket public so images can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'deal-attachments';