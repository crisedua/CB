-- Create storage bucket for incident scans
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-scans', 'incident-scans', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for public access
CREATE POLICY "Public Access for Incident Scans"
ON storage.objects FOR SELECT
USING (bucket_id = 'incident-scans');

CREATE POLICY "Authenticated users can upload incident scans"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'incident-scans');

CREATE POLICY "Authenticated users can update incident scans"
ON storage.objects FOR UPDATE
USING (bucket_id = 'incident-scans');

CREATE POLICY "Authenticated users can delete incident scans"
ON storage.objects FOR DELETE
USING (bucket_id = 'incident-scans');
