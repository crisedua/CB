-- Create storage bucket for incident scans
-- Note: You may need to create this bucket manually in the Supabase Dashboard
-- Go to Storage > New Bucket > Name: "incident-scans" > Public: Yes

-- If the bucket already exists, these policies will be added
-- If not, create the bucket first in the dashboard, then run these policies

-- Allow public read access
CREATE POLICY IF NOT EXISTS "Public Access for Incident Scans"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'incident-scans');

-- Allow anyone to upload (change to authenticated if you want to restrict)
CREATE POLICY IF NOT EXISTS "Anyone can upload incident scans"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'incident-scans');

-- Allow anyone to update
CREATE POLICY IF NOT EXISTS "Anyone can update incident scans"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'incident-scans');

-- Allow anyone to delete
CREATE POLICY IF NOT EXISTS "Anyone can delete incident scans"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'incident-scans');
